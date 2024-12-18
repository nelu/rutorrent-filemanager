<?php

namespace Flm;

use Exception;
use Iterator;

class FileChecksum implements Iterator
{
    public static $logger = TaskController::class;
    public $sfvfile;
    protected $file;
    protected $files;
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

    public function loadFiles($sfvfile)
    {
        if (!is_file($sfvfile)) {
            throw new Exception("Checksum file not found: " . $sfvfile, 2);
        }

        $fr = file($sfvfile);

        $filelines = [];
        foreach ($fr as $fl) {
            if (substr(trim($fl), 0, 1) == ';' || trim($fl) == "") {
                continue;
            }
            $filelines[] = self::parseFilehashLine($fl);
        }

        $this->files = $filelines;

        return $filelines;
    }

    public static function parseFilehashLine($fileLine)
    {
        $parts = explode(" ", trim($fileLine));
        $hash = trim(array_pop($parts));
        return [implode(" ", $parts), $hash];
    }

    public function setFiles($files = [])
    {
        $this->files = (array)$files;
    }

    public function setChecksumFile($checksumFile)
    {
        if (($this->sfvfile = fopen($checksumFile, "abt")) === FALSE) {
            throw new Exception('File not writable ' . $checksumFile);
        }
    }

    public static function fromChecksumFile($checksum_file, $type)
    {
        chdir(dirname($checksum_file));

        $check_files = new FileChecksum($checksum_file);

        $fcount = $check_files->length();
        $success = 0;
        (self::$logger)::log("-> " . $checksum_file . "\n");

        foreach ($check_files as $i => $item) {

            $i++;

            $file = $item[0];
            echo "({$i}/{$fcount}) Checking {$file} ... " . $item[1];

            try {

                if (!$check_files->checkFileHash($type)) {
                    (self::$logger)::error(' X Hash mismatch!');
                } else {
                    (self::$logger)::log(' ✓');
                    $success++;
                }

            } catch (Exception $err) {
                (self::$logger)::error($file . '- FAIL: ' . $err->getMessage());
            }

        }
        (self::$logger)::log("\nSuccess: " . $success . " | Failure: " . ($fcount - $success));
        return $success == $fcount;
    }

    public function length()
    {
        return count($this->files);
    }

    #[ReturnTypeWillChange]
    public function checkFileHash($type = 'CRC32')
    {
        if (count($this->file) < 2) {
            throw new Exception("Invalid line " . implode(' ', $this->file), 1);
        }

        $read_hash = $this->file[1];
        $file = $this->file[0];

        $calc_hash = self::getFileHash($file, $type);

        return ($calc_hash === $read_hash);

    }

    #[ReturnTypeWillChange]
    /**
     * @param $file
     * @param string $type
     * @return string
     * @throws Exception
     */
    public static function getFileHash($file, string $type = 'CRC32'): string
    {
        if (!is_file($file)) {
            throw new Exception('File found', 1);
        }

        $cmd = P7zip::hash([$file], $type);
        $entries = $cmd->run();

        $parts = static::parseFilehashLine($entries[1][0]);

        if (empty($parts[0])) {
            throw new Exception('File hashing error: ' . $file, 1);
        }

        return $parts[0];
    }

    #[ReturnTypeWillChange]
    public static function checksumFromFilelist(string $fileList, $checksumFile, $type = ' CRC32')
    {
        $files = json_decode(file_get_contents($fileList));

        if (empty($fileList) || empty($files)) {
            throw new Exception("File list is empty");
        }

        $hashed_count = 0;

        $self = new static($checksumFile, $files);
        $fileCount = $self->length();

        $self->write("; ruTorrent filemanager plugin ;\n");

        foreach ($self as $i => $file) {
            $i++;

            echo "({$i}/{$fileCount}) " . basename($file) . " ... ";

            try {
                $hash = self::getFileHash($file, $type);
                $self->writeFileHash($hash);
                $hashed_count++;
                (self::$logger)::log($hash . ' ✓');

            } catch (Exception $err) {
                (self::$logger)::log(' X FAILED:' . $err->getMessage());
            }

        }
        (self::$logger)::log("\n -> " . $checksumFile);

        $self = null;

        return $fileCount == $hashed_count;

    }

    #[ReturnTypeWillChange]
    public function write($line)
    {
        return fwrite($this->sfvfile, $line . "\n");
    }

    #[ReturnTypeWillChange]
    public function writeFileHash($hash)
    {
        return $this->write(basename($this->getCurFile()) . ' ' . $hash);
    }

    public function getCurFile()
    {
        return $this->file;
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
        return $this->file;
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

    public function __destruct()
    {
        if (is_resource($this->sfvfile)) {
            fclose($this->sfvfile);
        }
    }
}
