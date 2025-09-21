const multer = require('multer');

// Configure multer to store files in memory as buffers
const storage = multer.memoryStorage();

// File filter to ensure only .cpy and .dat files are accepted
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['text/plain', 'application/octet-stream'];
  const allowedExtensions = ['.cpy', '.dat'];

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().slice(-4);

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .cpy and .dat files are allowed.'), false);
  }
};

// Configure multer with storage, file filter, and limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 2 // Maximum 2 files
  }
});

module.exports = upload;