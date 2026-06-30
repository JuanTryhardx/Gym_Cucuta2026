<?php
require_once "../models/modelo_telegram.php";

class ControladorTelegram {
    
    public function recibirMensaje() {
        // Leer los datos entrantes del Webhook de Telegram
        $json = file_get_contents("php://input");
        $datos = json_decode($json, true);

        if (isset($datos["message"])) {
            $chatId = $datos["message"]["chat"]["id"];
            $textoRecibido = $datos["message"]["text"];

            $modelo = new ModeloTelegram();

            // Sistema de toma de decisiones para responder al usuario
            if ($textoRecibido == "/start") {
                $respuesta = "¡Hola! Bienvenido al sistema de ayuda automatizado de Gym Cucuta.";
            } elseif ($textoRecibido == "/ayuda") {
                $respuesta = "Puedes consultar nuestros horarios, planes o soporte técnico desde aquí.";
            } else {
                $respuesta = "Has enviado: " . $textoRecibido . ". Pronto un asesor te responderá.";
            }

            // Enviar la respuesta construida
            $modelo->enviarMensaje($chatId, $respuesta);
        }
    }
}

// Inicializar el controlador para escuchar peticiones de inmediato
$controlador = new ControladorTelegram();
$controlador->recibirMensaje();
?>
