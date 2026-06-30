<?php
class ModeloTelegram {
    private $token;
    private $apiUrl;

    public function __construct() {
        // El token que nos dio botfather
        $this->token = "8608543352:AAESa73tN5-559y7vq8f6VbQ0P81IKhkaE0"; 
        $this->apiUrl = "https://telegram.org" . $this->token;
    }

    // Funcion para procesar y enviar las respuestas a la API de Telegram
    public function enviarMensaje($chatId, $mensaje) {
        $url = $this->apiUrl . "/sendMessage?chat_id=" . $chatId . "&text=" . urlencode($mensaje);
        $respuesta = file_get_contents($url);
        return json_decode($respuesta, true);
    }
}
?>
