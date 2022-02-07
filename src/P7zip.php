<?php


namespace Flm;


use Exception;

class P7zip extends ShellCmd
{
    const EXTRACT_COMMAND = 'x';
    const ARCHIVE_COMMAND = 'a';
    const HASH_COMMAND = 'h';

    const FILE_LIST_ARG = '@';
    const ARCHIVE_FILE_ARG = '';
    const SWITCHES_DELIMITER = '--';

    const DISABLE_ARCHIVE_FILE_ARG = '-an';
    const PASSWORD_SWITCH = '-p';
    const ARCHIVE_TYPE_SWITCH = '-t';
    const COMPRESSION_LEVEL_SWITCH = '-mx';
    const PROGRESS_DISPLAY_SWITCH = '-bsp';
    const WRITE_STDOUT_SWITCH = '-so';
    const READ_STDIN_SWITCH = '-si';
    const OUTPUT_DIR_SWITCH = '-o';
    const VOLUME_SIZE_SWITCH = '-v';

    protected $args = [
        self::PROGRESS_DISPLAY_SWITCH => null,
        self::ARCHIVE_TYPE_SWITCH => null,
        self::PASSWORD_SWITCH => null,
        self::COMPRESSION_LEVEL_SWITCH => null,
        self::VOLUME_SIZE_SWITCH => null,
        self::WRITE_STDOUT_SWITCH => null,
        self::READ_STDIN_SWITCH => null,
        self::DISABLE_ARCHIVE_FILE_ARG => null,
        self::OUTPUT_DIR_SWITCH => null,
        self::SWITCHES_DELIMITER => true,
        self::ARCHIVE_FILE_ARG => null,
        self::FILE_LIST_ARG => null,
    ];

    /**
     * P7zip constructor.
     * @param string $binPath
     */
    public function __construct(string $binPath = '7z')
    {
        parent::__construct($binPath);
    }

    /**
     * @param string $archive
     * @return P7zip
     * @throws Exception
     */
    public static function pack(string $archive): P7zip
    {
        $self = new static();
        $self->setCommand(static::ARCHIVE_COMMAND);
        $self->setArchiveFile($archive);

        if (empty($self->getArchiveFile()) && !$self->archiveFileIsDisabled()) {
            throw new Exception("Invalid archive file: " . $archive);
        }

        return $self;
    }

    /**
     * @param string $archive
     * @param string $toDirectory
     * @return string
     * @throws Exception
     */
    public static function unpack(string $archive, string $toDirectory = ''): P7zip
    {
        $self = new static();
        $self->setCommand(static::EXTRACT_COMMAND);
        $self->setArchiveFile($archive);
        if (!empty($toDirectory)) {
            $self->setOutputDir($toDirectory);
        }

        if (empty($self->getArchiveFile()) && !$self->archiveFileIsDisabled()) {
            throw new Exception("Invalid archive file: " . $archive);
        }

        return $self;
    }

    public static function hash(string $checksumfile)
    {
        $self = new static();
        $self->setCommand(static::HASH_COMMAND);
        return $self;
    }

    public function setCompression(int $value = 1)
    {
        $this->setArg(static::COMPRESSION_LEVEL_SWITCH, $value);
        return $this;
    }

    public function setProgressIndicator(int $value = 1)
    {
        $this->setArg(static::PROGRESS_DISPLAY_SWITCH, $value);
        return $this;
    }

    public function setArchiveType(string $value)
    {
        $this->setArg(static::ARCHIVE_TYPE_SWITCH, $value);
        return $this;
    }

    public function setReadFromStdin(bool $value)
    {
        $this->setArg(static::READ_STDIN_SWITCH, $value);
        return $this;
    }

    public function setStdOutput(bool $value)
    {
        $this->setArg(static::WRITE_STDOUT_SWITCH, $value);
        //$this->disableArchiveFile($value);
        return $this;
    }

    /**
     * @return string
     */
    public function getFileList(): string
    {
        return $this->getArg(static::FILE_LIST_ARG);
    }

    /**
     * @param string $listPath
     * @return P7zip
     */
    public function setFileList(string $listPath)
    {
        $this->setArg(static::FILE_LIST_ARG, $listPath);
        return $this;
    }

    /**
     * @param string $command
     */
    public function setCommand(string $command)
    {
        array_unshift($this->args, $command);
    }

    /**
     * @param string $archiveFile
     * @return P7zip
     */
    public function setArchiveFile(string $archiveFile)
    {
        if (empty($archiveFile)) {
            $this->disableArchiveFile();
        } else {
            $this->disableArchiveFile(false);
            $this->setArg(static::ARCHIVE_FILE_ARG, $archiveFile);
        }

        return $this;
    }

    public function disableArchiveFile(bool $value = true)
    {
        $this->setArg(static::DISABLE_ARCHIVE_FILE_ARG, $value);
        return $this;
    }

    public function setOutputDir(string $value)
    {
        $this->setArg(static::OUTPUT_DIR_SWITCH, $value);
        return $this;
    }

    /**
     * @return string
     */
    public function getArchiveFile(): string
    {
        return (string)$this->getArg(static::ARCHIVE_FILE_ARG);
    }

    public function archiveFileIsDisabled(): bool
    {
        return (bool)$this->getArg(static::DISABLE_ARCHIVE_FILE_ARG);
    }

    public function setPassword(string $p)
    {
        $this->setArg(static::PASSWORD_SWITCH, $p);
        return $this;
    }

    public function setVolumeSize($value = 0)
    {
        if(!empty($value))
        {
            $value = $value.'k';
        }
        $this->setArg('-v', $value);
        return $this;
    }
}