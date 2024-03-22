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

        var_dump(__METHOD__,
            $this->tmpFile,
            FileChecksum::getFileHash($this->tmpFile),
            FileChecksum::getFileHash($this->tmpFile, 'SHA1'),
            FileChecksum::getFileHash($this->tmpFile, 'SHA256')

        );

        $sfv_file = "{$this->tempTestDir}/files_checksum.sfv";
        $sfv_filelist = "{$this->tempTestDir}/checksum_filelist.txt";

        $files =  glob("{$this->tempTestDir}/*");
        file_put_contents($sfv_filelist, json_encode($files));

        var_dump(
            FileChecksum::checksumFromFilelist($sfv_filelist, $sfv_file),
            FileChecksum::fromChecksumFile($sfv_file)
        );

    }

    public function testArchives() {
        $archive = new Archive(null, Helper::getConfig('archive'));

        $rar_archive = "{$this->tmpFile}.rar";
        $zip_archive = "{$this->tmpFile}.zip";

        chdir($this->tempTestDir);

        $archive_filelist = "{$this->tempTestDir}/archive_filelist.txt";
        file_put_contents($archive_filelist, basename($this->tmpFile));
        var_dump(
        __METHOD__,
            ShellCmd::bin('cd', [$this->tempTestDir])->run(),
            // rar bin wrapper
            Rar::pack($rar_archive)
                ->setFileList($archive_filelist)
                ->run(),
            Rar::unpack($rar_archive, $this->tempTestDir)->setPassword("123")->cmd(),
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
            $archive->compressCmd((object)[
                'type' => 'tar.gz',
                'multiplePass' => ['tar', 'gzip'],
                'archive' => "{$this->tmpFile}.tgz",
                'binary' => '7z',
                'fileList' => $archive_filelist,
                // 'password' => "123", // not supported
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run(),
            // rar file
            $archive->compressCmd((object)[
                'type' => 'rar',
                'archive' => $rar_archive,
                'fileList' => $archive_filelist,
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])->run()
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





