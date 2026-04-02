<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Method not allowed';
	exit;
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Missing file';
	exit;
}

$type = strtolower((string)($_POST['type'] ?? ''));
if (!in_array($type, ['png', 'webp'], true)) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Invalid output type';
	exit;
}

$upload = $_FILES['file'];
if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Upload failed';
	exit;
}

$tmp = (string)$upload['tmp_name'];
if (!is_uploaded_file($tmp)) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Invalid upload';
	exit;
}

$fileinfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$fileinfo->file($tmp);
if (!in_array($mime, ['image/png', 'image/webp', 'image/jpeg'], true)) {
	http_response_code(400);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Unsupported input type';
	exit;
}

try {
	$outputData = '';

	if (extension_loaded('imagick')) {
		$img = new Imagick();
		$img->readImage($tmp);
		$img->stripImage();

		if ($type === 'png') {
			$img->setImageFormat('png');
			$img->setOption('png:compression-level', '9');
			$img->setOption('png:compression-strategy', '1');
		} else {
			$img->setImageFormat('webp');
			$img->setOption('webp:lossless', 'true');
			$img->setImageCompressionQuality(100);
		}

		$outputData = $img->getImagesBlob();
		$img->clear();
		$img->destroy();
	} else if (extension_loaded('gd')) {
		$binary = file_get_contents($tmp);
		if ($binary === false) {
			throw new RuntimeException('Failed to read upload');
		}
		$source = imagecreatefromstring($binary);
		if ($source === false) {
			throw new RuntimeException('Failed to decode image');
		}

		ob_start();
		if ($type === 'png') {
			imagepng($source, null, 9, PNG_ALL_FILTERS);
		} else {
			imagesavealpha($source, true);
			imagewebp($source, null, 100);
		}
		$outputData = (string)ob_get_clean();
		imagedestroy($source);
	} else {
		throw new RuntimeException('No optimizer backend available');
	}

	if ($outputData === '') {
		throw new RuntimeException('Optimizer produced empty output');
	}

	$filename = 'optimized.' . $type;
	header('Content-Type: ' . ($type === 'png' ? 'image/png' : 'image/webp'));
	header('Content-Disposition: attachment; filename="' . $filename . '"');
	header('Cache-Control: no-store');
	echo $outputData;
} catch (Throwable $e) {
	http_response_code(500);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Optimization failed';
}

