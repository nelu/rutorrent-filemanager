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

        $tmpfname = tempnam($this->tempTestDir, "filemanager-hash-test");
        file_put_contents($tmpfname, time());

        $result_hash = FileChecksum::getFileHash($tmpfname);
        var_dump(__METHOD__, $tmpfname, $result_hash);
        unlink($tmpfname);
    }

    public function testArchives() {
        $archive = new Archive(null, Helper::getConfig('archive'));

        var_dump(
        __METHOD__,

            // rar bin wrapper
            Rar::unpack('myarchive.rar', '/tmp/')->setPassword("123")->cmd(),
            Rar::pack('myarchive.rar')
                ->setFileList('/tmp/filelist.txt')
                ->cmd(),

            // zip file
            $archive->compressCmd((object)[
                'type' => 'zip',
                'archive' => './mydir/myarchive.zip',
                'binary' => '7z',
                'fileList' => '/tmp/myarchive.zip_compress_list.txt',
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ]),
            // tar.gz file
            $archive->compressCmd((object)[
                'type' => 'tar.gz',
                'multiplePass' => ['tar', 'gzip'],
                'archive' => './mydir/myarchive.tgz',
                'binary' => '7z',
                'fileList' => '/tmp/myarchive.tgz_compress_list.txt',
                // 'password' => "123", // not supported
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ]),
            // rar file
            $archive->compressCmd((object)[
                'type' => 'rar',
                'archive' => './mydir/myarchive.rar',
                'binary' => '/home/user/bin/rar',
                'fileList' => '/tmp/myarchive.rar_compress_list.txt',
                'password' => "123",
                'volumeSize' => 1024 * 1000,
                'compression' => 0
            ])
        );
    }

    public function runTests() {
        $this->tempTestDir = '/tmp/'.static::class;
        $this->testFilesystemCommands();
        $this->testFileChecksum();
        $this->testArchives();


        // cleanup
        var_dump(ShellCmds::recursiveRemove($this->tempTestDir)->run());
    }
}

(new FileManagerTests())->runTests();





