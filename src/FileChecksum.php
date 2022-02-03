<?php

namespace Flm;

use \Exception;

class FileChecksum implements \Iterator
{
    public static $logger = TaskController::class;

    protected $file;
    protected $files;
    public $sfvfile;

    protected $position = 0;

    public function __construct($checksFile, $files = [])
    {
        $this->position = 0;

        if (empty($files)) {
            $this->loadFiles($checksFile);
        } else {
            $this->setFiles($files);
        }
        $this->setChecksumFile($checksFile);
    }

    public function setFiles($files = []) {
        $this->files = (array)$files;
    }

    public function loadFiles($sfvfile)
    {
        if (!is_file($sfvfile)) {
            throw new Exception("Checksum file not found: " . $sfvfile, 2);
        }

        $fr = file($sfvfile);

        $filelines = [];
        foreach ($fr as $fl) {
            if (substr(trim($fl), 0, 1) == ';') {
                continue;
            }
            $filelines[] = $fl;
        }

        $this->files = $filelines;

        return $filelines;
    }

    public function getCurFile()
    {
        return $this->file;
    }

    public function checkFileHash($against = null)
    {
        $parts = explode(' ', trim($this->file));

        if (count($parts) < 2) {
            throw new Exception("Invalid line " . implode(' ', $this->file), 1);
        }

        $read_hash = array_pop($parts);

        $file = implode(' ', $parts);
        $calc_hash = self::getFileHash($file);

        return ($calc_hash === $read_hash);

    }

    public static function getFileHash($file)
    {
        if (!is_file($file)) {
            throw new \Exception(' No such file found...', 1);
        }

        return hash_file('crc32b', $file);
    }

    public function length()
    {
        return count($this->files);
    }

    #[\ReturnTypeWillChange]
    function rewind()
    {
        $this->position = 0;
        $this->file = null;
    }

    #[\ReturnTypeWillChange]
    function current()
    {
        $this->file = $this->files[$this->position];
        return $this;
    }

    #[\ReturnTypeWillChange]
    function key()
    {
        return $this->position;
    }

    #[\ReturnTypeWillChange]
    function next()
    {

        ++$this->position;
    }

    #[\ReturnTypeWillChange]
    function valid()
    {
        return isset($this->files[$this->position]);
    }
    public function write($line) {
        return fwrite($this->sfvfile, $line . "\n");
    }
    public function writeFileHash($hash) {
        return $this->write(basename($this->getCurFile()) . ' ' . $hash );
    }
    public static function fromChecksumFile($checksum_file)
    {
        chdir(dirname($checksum_file));

        $check_files = new FileChecksum($checksum_file);

        $fcount = $check_files->length();
        $success = 0;

        foreach ($check_files as $i => $item) {

            $i++;

            $file = implode(' ', explode(' ', $item->getCurFile(), -1));
            $msg = "({$i}/{$fcount}) Checking {$file} ... ";

            try {

                if (!$item->checkFileHash()) {
                    (self::$logger)::error($msg . '- Hash mismatch!');
                } else {
                    (self::$logger)::log($msg . '✓ ');
                    $success++;
                }

            } catch (Exception $err) {
                (self::$logger)::error($msg . '- FAILED:' . $err->getMessage());
            }

        }
        (self::$logger)::log("\n--- Done: ".$fcount. ' - Success: '.$success);
        return $success == $fcount;
    }

    public static function checksumFromFilelist($files, $checksumFile)
    {
        if(is_string($files))
        {
            $files = json_decode(file_get_contents($files));
        }

        if(count($files) < 1)
        {
            throw new Exception("File list is empty");
        }
        chdir(dirname($files[0]));

        $checksum = new FileChecksum($checksumFile, $files);

        // comments
        $checksum->write("; ruTorrent filemanager;");

        $fcount = count($files);
        $success = 0;

        foreach ($checksum as $i => $sfvinstance) {

            $i++;

            $file = $sfvinstance->getCurFile();

            $msg = "({$i}/{$fcount}) Hashing {$file} ... ";

            try {
                $hash = FileChecksum::getFileHash($file);
                $checksum->writeFileHash($hash);
                $success++;
                (self::$logger)::log($msg . ' ✓  ' . $hash);

            } catch (Exception $err) {
                (self::$logger)::log($msg . ' - FAILED:' . $err->getMessage());
            }

        }
        $checksum = null; // calling fclose from destructor
        (self::$logger)::log("\n--- Done");
        return $success == $fcount;
    }

    public function setChecksumFile($checksumFile)
    {
        if (($this->sfvfile = fopen($checksumFile, "abt")) === FALSE) {
            throw new Exception('File not writable ' . $checksumFile);
        }
    }

    public function __destruct()
    {
     if(is_resource($this->sfvfile))
     {
         fclose($this->sfvfile);
     }
    }
}
