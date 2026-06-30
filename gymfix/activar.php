<?php
// Datos de configuración
$token = "8608543352:AAESa73tN5-559y7vq8f6VbQ0P81IKhkaE0";
$url_controlador = "https://je.org";

// Construcción automática de la URL de activación
$url_api = "https://telegram.org" . $token . "/setWebhook?url=" . urlencode($url_controlador);

// Ejecutar la activación y mostrar el resultado en pantalla
$resultado = file_get_contents($url_api);
echo "<h3>Resultado de la activación:</h3>";
echo "<pre>" . htmlspecialchars($resultado) . "</pre>";
?>
