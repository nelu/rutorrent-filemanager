<?php

use Flm\Archive;
use Flm\FileChecksum;
use Flm\Filesystem;
use Flm\Helper;
use Flm\P7zip;
use Flm\Rar;
use Flm\ShellCmd;
use Flm\ShellCmds;

if (!defined('STDOUT'))
{
    exit;
}

include 'boot.php';

class  FileManagerTests {

    /**
     * @var string
     */
    private $tempTestDir;
    /**
     * @var bool|string
     */
    private $tmpFile;

    public function testFilesystemCommands() {
        $fs = new Filesystem($this->tempTestDir);

        var_dump(
            __METHOD__,
            ShellCmds::recursiveCopy('/tmp/mew2', '/tmp/mew3')->cmd()
        );

        var_dump(
            ShellCmds::mkdir($this->tempTestDir, true, '0777')->run(),
            ShellCmd::bin('/bin/ls', ['-la', '/tmp/'])->end('|')->setArg('cat', true)->run()
        );

        // remote filesystem tests
        var_dump(
            $fs->isDir($this->tempTestDir),
            $fs->isFile($this->tempTestDir),
            $fs->pathExists($this->tempTestDir)
        );



    }

    public function testFileChecksum() {
        $algorithms = [
            'CRC32' => 'crc32b',
            'SHA1' => 'sha1',
            'SHA256' => 'sha256',
        ];
        $hashes = [];

        foreach ($algorithms as $type => $phpAlgorithm) {
            $actual = FileChecksum::getFileHash($this->tmpFile, $type);
            $expected = hash_file($phpAlgorithm, $this->tmpFile);
            if (strcasecmp($actual, $expected) !== 0) {
                throw new RuntimeException("{$type} mismatch: expected {$expected}, got {$actual}");
            }
            $hashes[$type] = $actual;
        }

        $sfv_file = "{$this->tempTestDir}/files_checksum.sfv";
        $sfv_filelist = "{$this->tempTestDir}/checksum_filelist.txt";

        $files = [$this->tmpFile];
        if (file_put_contents($sfv_filelist, json_encode($files)) === false) {
            throw new RuntimeException('Unable to write checksum file list');
        }

        $created = FileChecksum::checksumFromFilelist($sfv_filelist, $sfv_file);
        if (!$created) {
            throw new RuntimeException('Checksum file creation failed');
        }

        $sfvContents = file_get_contents($sfv_file);
        if ($sfvContents === false || !str_contains($sfvContents, basename($this->tmpFile) . ' ')) {
            throw new RuntimeException('Checksum file does not contain the source file');
        }

        $verified = FileChecksum::fromChecksumFile($sfv_file, 'CRC32');
        if (!$verified) {
            throw new RuntimeException('Checksum verification failed');
        }

        var_dump(
            __METHOD__,
            $this->tmpFile,
            $hashes,
            $created,
            $verified
        );

    }

    private function commandExists(string $binary): bool {
        if (str_contains($binary, DIRECTORY_SEPARATOR)) {
            return is_executable($binary);
        }

        return ShellCmd::bin('command', ['-v', $binary])->run()[0] === 0;
    }

    private function runTarGzArchiveTest(ShellCmd $command, string $fileList): array {
        $generatedCommand = $command->cmd();
        $passes = explode(' | ', $generatedCommand, 2);
        $expectedFileList = '@' . Helper::mb_escapeshellarg($fileList);

        if (count($passes) !== 2) {
            throw new RuntimeException('tar.gz command does not contain two archive passes: ' . $generatedCommand);
        }
        if (!str_contains($passes[0], $expectedFileList)) {
            throw new RuntimeException('tar pass is missing its file list: ' . $generatedCommand);
        }
        if (!str_contains($passes[1], '-si')) {
            throw new RuntimeException('gzip pass is not reading from stdin: ' . $generatedCommand);
        }
        if (str_contains($passes[1], "@''")) {
            throw new RuntimeException('gzip pass contains an empty file list: ' . $generatedCommand);
        }

        $result = $command->run();
        if ($result[0] !== 0) {
            throw new RuntimeException("tar.gz archive command failed:\n" . implode("\n", $result[1]));
        }

        return $result;
    }

    public function testArchives() {
        $archive = new Archive(null, Helper::getConfig('archive'));

        $rar_archive = "{$this->tmpFile}.rar";
        $zip_archive = "{$this->tmpFile}.zip";
        $rarBinary = Utility::getExternal('rar');
        $rarAvailable = $this->commandExists($rarBinary);

        chdir($this->tempTestDir);

        $archive_filelist = "{$this->tempTestDir}/archive_filelist.txt";
        file_put_contents($archive_filelist, basename($this->tmpFile));

        if ($rarAvailable) {
            $rarPackResult = Rar::pack($rar_archive)
                ->binary($rarBinary)
                ->setFileList($archive_filelist)
                ->run();
            $rarUnpackCommand = Rar::unpack($rar_archive, $this->tempTestDir)
                ->binary($rarBinary)
                ->setPassword("123")
                ->cmd();
            $rarArchiveResult = $archive->compressCmd((object)[
                'type' => 'rar',
                'archive' => $rar_archive,
                'fileList' => $archive_filelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run();
        } else {
            $rarPackResult = 'SKIPPED: RAR binary is not available';
            $rarUnpackCommand = $rarPackResult;
            $rarArchiveResult = $rarPackResult;
        }

        var_dump(
        __METHOD__,
            ShellCmd::bin('cd', [$this->tempTestDir])->run(),
            // rar bin wrapper
            $rarPackResult,
            $rarUnpackCommand,
            // 7zip file
            $archive->compressCmd((object)[
                'type' => '7z',
                'archive' =>  "{$this->tmpFile}.7z",
                'binary' => '7z',
                'fileList' => $archive_filelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run(),

            // zip file
            $archive->compressCmd((object)[
                'type' => 'zip',
                'archive' => $zip_archive,
                'binary' => '7z',
                'fileList' => $archive_filelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run(),
            // tar.gz file
            $this->runTarGzArchiveTest(
                $archive->compressCmd((object)[
                    'type' => 'tar.gz',
                    'multiplePass' => ['tar', 'gzip'],
                    'archive' => "{$this->tmpFile}.tgz",
                    'binary' => '7z',
                    'fileList' => $archive_filelist,
                    // 'password' => "123", // not supported
                    'volumeSize' => 1024 * 1000,
                    'compression' => 0
                ]),
                $archive_filelist
            ),
            // rar file
            $rarArchiveResult
        );
    }

    public function runTests() {
        $this->tempTestDir = '/tmp/'.static::class;

        // cleanup
        var_dump(ShellCmds::recursiveRemove($this->tempTestDir)->run());
        $this->testFilesystemCommands();


        $this->tmpFile = tempnam($this->tempTestDir, "filemanager-test");
        file_put_contents($this->tmpFile, time());

        $this->testArchives();
        ////$this->tempTestDir

        $this->testFileChecksum();
    }
}

(new FileManagerTests())->runTests();



