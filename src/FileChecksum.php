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

    public static function fromChecksumFile($checksum_file)
    {
        chdir(dirname($checksum_file));
        // awk '$1 !~ /regex/{getline;print $1}' 1test.mp4.sfv  > /tmp/task.list && 7z h @/tmp/task.list

        $check_files = new FileChecksum($checksum_file);

        $fcount = $check_files->length();
        $success = 0;

        foreach ($check_files as $i => $item) {

            $i++;

            $file = $item[0];
            echo "({$i}/{$fcount}) Checking {$file} ... ".$item[1];

            try {

                if (!$check_files->checkFileHash()) {
                    (self::$logger)::error(' X Hash mismatch!');
                } else {
                    (self::$logger)::log(' ✓');
                    $success++;
                }

            } catch (Exception $err) {
                (self::$logger)::error($file . '- FAIL: ' . $err->getMessage());
            }

        }
        (self::$logger)::log("\nSuccess: " . $success . " | Failure: " . ($fcount-$success));
        return $success == $fcount;
    }

    public function length()
    {
        return count($this->files);
    }

    public function getCurFile()
    {
        return $this->file;
    }

    #[\ReturnTypeWillChange]

    public function checkFileHash($against = null)
    {
        if (count($this->file) < 2) {
            throw new Exception("Invalid line " . implode(' ', $this->file), 1);
        }

        $read_hash = $this->file[1];
        $file = $this->file[0];

        $calc_hash = self::getFileHash($file);

        return ($calc_hash === $read_hash);

    }

    #[\ReturnTypeWillChange]

    /**
     * @param $file
     * @param string $hash
     * @return string
     * @throws Exception
     */
    public static function getFileHash($file, $hash = ''): string
    {
        if (!is_file($file)) {
            throw new Exception('File found', 1);
        }

        $entries = P7zip::hash([$file])->run();

        $parts = explode(" ",$entries[1][0]);

        $hash = trim(array_shift($parts));
        $fileName = implode(" ", $parts);

        if(basename($fileName) !== basename($file))
        {
            throw new Exception('File hashing error: '. $fileName, 1);

        }
        //$oldh = hash_file('crc32b', $file);

        return $hash;
    }

    #[\ReturnTypeWillChange]

    public static function checksumFromFilelist(string $fileList, $checksumFile)
    {
        $files = json_decode(file_get_contents($fileList));

        if (empty($fileList) || empty($files)) {
            throw new Exception("File list is empty");
        }

        $hashed_count = 0;

        $self = new static($checksumFile, $files);
        $fileCount = $self->length();

        $self->write("; ruTorrent filemanager plugin ;\n");

        foreach ($self as $i => $file)
        {
            $i++;

            echo "({$i}/{$fileCount}) Hashing ".basename($file)." ... ";

            try {
                $hash = self::getFileHash($file);
                $self->writeFileHash($hash);
                $hashed_count++;
                (self::$logger)::log($hash. ' ✓' );

            } catch (Exception $err) {
                (self::$logger)::log(' X FAILED:' . $err->getMessage());
            }

        }
        (self::$logger)::log("\n--- Done");

        $self = null;

        return $fileCount == $hashed_count;

    }

    public static function parseFilehashLine($fileLine) {
        $parts = explode(" ", trim($fileLine));

        return [trim(array_shift($parts)), implode(" ", $parts)];
    }

    #[\ReturnTypeWillChange]

    public function write($line)
    {
        return fwrite($this->sfvfile, $line . "\n");
    }

    #[\ReturnTypeWillChange]

    public function writeFileHash($hash)
    {
        return $this->write(basename($this->getCurFile()) . ' ' . $hash);
    }

    function rewind()
    {
        $this->position = 0;
        $this->file = null;
    }

    function current()
    {
        $this->file = $this->files[$this->position];
        return $this->file;
    }

    function key()
    {
        return $this->position;
    }

    function next()
    {

        ++$this->position;
    }

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
