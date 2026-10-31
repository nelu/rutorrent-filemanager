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
    private $unicodeStem;
    private $unicodeFilename;
    private $unicodeContents;
    private $unicodeFile;

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
        $files = [$this->tmpFile, $this->unicodeFile];

        foreach ($files as $file) {
            foreach ($algorithms as $type => $phpAlgorithm) {
                $actual = FileChecksum::getFileHash($file, $type);
                $expected = hash_file($phpAlgorithm, $file);
                if (strcasecmp($actual, $expected) !== 0) {
                    throw new RuntimeException("{$type} mismatch for {$file}: expected {$expected}, got {$actual}");
                }
                $hashes[basename($file)][$type] = $actual;
            }
        }

        $sfv_file = "{$this->tempTestDir}/files_checksum-{$this->unicodeStem}.sfv";
        $sfv_filelist = "{$this->tempTestDir}/checksum_filelist-{$this->unicodeStem}.json";

        $encodedFiles = json_encode($files, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (file_put_contents($sfv_filelist, $encodedFiles) === false) {
            throw new RuntimeException('Unable to write checksum file list');
        }

        $created = FileChecksum::checksumFromFilelist($sfv_filelist, $sfv_file);
        if (!$created) {
            throw new RuntimeException('Checksum file creation failed');
        }

        $sfvContents = file_get_contents($sfv_file);
        if ($sfvContents === false) {
            throw new RuntimeException('Unable to read checksum file');
        }
        foreach ($files as $file) {
            if (!str_contains($sfvContents, basename($file) . ' ')) {
                throw new RuntimeException("Checksum file does not contain {$file}");
            }
        }

        $verified = FileChecksum::fromChecksumFile($sfv_file, 'CRC32');
        if (!$verified) {
            throw new RuntimeException('Checksum verification failed');
        }

        var_dump(
            __METHOD__,
            $files,
            $hashes,
            $created,
            $verified
        );

    }

    private function assertCommandSucceeded(array $result, string $operation): void {
        if ($result[0] !== 0) {
            throw new RuntimeException($operation . " failed:\n" . implode("\n", $result[1]));
        }
    }

    private function assertExtractedFile(string $file, string $expectedContents, string $archiveType): void {
        if (!is_file($file)) {
            throw new RuntimeException("{$archiveType} did not preserve the filename: {$file}");
        }

        $actualContents = file_get_contents($file);
        if ($actualContents !== $expectedContents) {
            throw new RuntimeException("{$archiveType} did not preserve the file contents: {$file}");
        }
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
        $archiveBase = "{$this->tmpFile}-{$this->unicodeStem}";
        $rarArchive = "{$archiveBase}.rar";
        $sevenZipArchive = "{$archiveBase}.7z";
        $zipArchive = "{$archiveBase}.zip";
        $tarGzArchive = "{$archiveBase}.tgz";
        $rarBinary = Utility::getExternal('rar');
        $rarAvailable = $this->commandExists($rarBinary);
        $originalDirectory = getcwd();
        $sourceContents = file_get_contents($this->tmpFile);

        if ($sourceContents === false) {
            throw new RuntimeException('Unable to read archive source file');
        }
        if (!chdir($this->tempTestDir)) {
            throw new RuntimeException('Unable to enter archive test directory');
        }

        try {
            $archiveFilelist = "{$this->tempTestDir}/archive_filelist-{$this->unicodeStem}.txt";
            $archiveFiles = [basename($this->tmpFile), $this->unicodeFilename];
            if (file_put_contents($archiveFilelist, implode("\n", $archiveFiles) . "\n") === false) {
                throw new RuntimeException('Unable to write archive file list');
            }

            if ($rarAvailable) {
                $rarPackResult = Rar::pack($rarArchive)
                    ->binary($rarBinary)
                    ->setFileList($archiveFilelist)
                    ->run();
                $this->assertCommandSucceeded($rarPackResult, 'RAR archive creation');

                $rarExtractDir = "{$this->tempTestDir}/extract-rar-{$this->unicodeStem}";
                if (!mkdir($rarExtractDir, 0777, true) && !is_dir($rarExtractDir)) {
                    throw new RuntimeException('Unable to create RAR extraction directory');
                }
                $rarUnpackResult = Rar::unpack($rarArchive, $rarExtractDir)
                    ->binary($rarBinary)
                    ->run();
                $this->assertCommandSucceeded($rarUnpackResult, 'RAR extraction');
                $this->assertExtractedFile(
                    "{$rarExtractDir}/" . basename($this->tmpFile),
                    $sourceContents,
                    'RAR'
                );
                $this->assertExtractedFile(
                    "{$rarExtractDir}/{$this->unicodeFilename}",
                    $this->unicodeContents,
                    'RAR'
                );

                $rarArchiveResult = $archive->compressCmd((object)[
                    'type' => 'rar',
                    'archive' => $rarArchive,
                    'fileList' => $archiveFilelist,
                    'password' => "123",
                    'volumeSize' => 1024 * 1000,
                    'compression' => 0
                ])->run();
            } else {
                $rarPackResult = 'SKIPPED: RAR binary is not available';
                $rarUnpackResult = $rarPackResult;
                $rarArchiveResult = $rarPackResult;
            }

            $sevenZipResult = $archive->compressCmd((object)[
                'type' => '7z',
                'archive' => $sevenZipArchive,
                'binary' => '7z',
                'fileList' => $archiveFilelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run();
            $this->assertCommandSucceeded($sevenZipResult, '7z archive creation');

            $sevenZipVolume = "{$sevenZipArchive}.001";
            if (!is_file($sevenZipVolume)) {
                throw new RuntimeException('Split 7z archive was not created');
            }
            $sevenZipExtractDir = "{$this->tempTestDir}/extract-7z-{$this->unicodeStem}";
            if (!mkdir($sevenZipExtractDir, 0777, true) && !is_dir($sevenZipExtractDir)) {
                throw new RuntimeException('Unable to create 7z extraction directory');
            }
            $sevenZipExtractResult = P7zip::unpack($sevenZipVolume, $sevenZipExtractDir)
                ->binary(Utility::getExternal('7zip'))
                ->setPassword("123")
                ->run();
            $this->assertCommandSucceeded($sevenZipExtractResult, '7z extraction');
            $this->assertExtractedFile(
                "{$sevenZipExtractDir}/" . basename($this->tmpFile),
                $sourceContents,
                '7z'
            );
            $this->assertExtractedFile(
                "{$sevenZipExtractDir}/{$this->unicodeFilename}",
                $this->unicodeContents,
                '7z'
            );

            $zipResult = $archive->compressCmd((object)[
                'type' => 'zip',
                'archive' => $zipArchive,
                'binary' => '7z',
                'fileList' => $archiveFilelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run();

            $tarGzResult = $this->runTarGzArchiveTest(
                $archive->compressCmd((object)[
                    'type' => 'tar.gz',
                    'multiplePass' => ['tar', 'gzip'],
                    'archive' => $tarGzArchive,
                    'binary' => '7z',
                    'fileList' => $archiveFilelist,
                    // 'password' => "123", // not supported
                    'volumeSize' => 1024 * 1000,
                    'compression' => 0
                ]),
                $archiveFilelist
            );

            var_dump(
                __METHOD__,
                $archiveFiles,
                $rarPackResult,
                $rarUnpackResult,
                $sevenZipResult,
                $sevenZipExtractResult,
                $zipResult,
                $tarGzResult,
                $rarArchiveResult
            );
        } finally {
            if ($originalDirectory !== false) {
                chdir($originalDirectory);
            }
        }
    }

    public function runTests() {
        $this->tempTestDir = '/tmp/'.static::class;

        // cleanup
        var_dump(ShellCmds::recursiveRemove($this->tempTestDir)->run());
        $this->testFilesystemCommands();


        $this->tmpFile = tempnam($this->tempTestDir, "filemanager-test");
        if ($this->tmpFile === false || file_put_contents($this->tmpFile, time()) === false) {
            throw new RuntimeException('Unable to write archive source file');
        }

        $this->unicodeStem = "Unicode \u{00E9}-\u{0416}-\u{65E5}\u{672C}\u{8A9E}-\u{1F9EA}";
        $this->unicodeFilename = "{$this->unicodeStem}.txt";
        $this->unicodeContents = "Multibyte content: \u{00E9} \u{0416} \u{65E5}\u{672C}\u{8A9E} \u{1F9EA}\n";
        $this->unicodeFile = "{$this->tempTestDir}/{$this->unicodeFilename}";
        if (file_put_contents($this->unicodeFile, $this->unicodeContents) === false) {
            throw new RuntimeException('Unable to write Unicode source file');
        }

        $this->testArchives();
        ////$this->tempTestDir

        $this->testFileChecksum();
    }
}

(new FileManagerTests())->runTests();
