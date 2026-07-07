import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(cors()); // <-- Esto le da permiso a tu Live Server de consultar el backend
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicializar Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// RUTA PARA EL REPORTE CON IA Y TELEGRAM
// ==========================================
app.post('/api/reportes/generar-reporte-bot', async (req, res) => {
    try {
        console.log("🤖 Iniciando recopilación de datos para el reporte...");

        // 1. OBTENER FECHA DE INICIO DE ESTE MES
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // 2. CONTAR PERSONAS NUEVAS REGISTRADAS ESTE MES
        const { count: nuevasPersonas, error: errPersonas } = await supabase
            .from('personas')
            .select('*', { count: 'exact', head: true })
            .gte('fecha_registro', inicioMes);

        // 3. CONSULTAR TODAS LAS PERSONAS (Para ver sus plan_id)
        const { data: personasData, error: errDataPersonas } = await supabase
            .from('personas')
            .select('plan_id');

        // 4. CONSULTAR TODOS LOS PLANES (Para saber sus nombres mediante el ID)
        const { data: planesData, error: errDataPlanes } = await supabase
            .from('planes')
            .select('id, nombre');

        if (errPersonas || errDataPersonas || errDataPlanes) {
            console.error("Error BD Personas:", errPersonas || errDataPersonas);
            console.error("Error BD Planes:", errDataPlanes);
            throw new Error("No se pudieron extraer los datos de Supabase");
        }

        // Mapear los planes en un objeto para buscar rápido por ID -> { 1: 'Mensual', 2: 'Anual' }
        const mapaPlanes = {};
        planesData?.forEach(p => {
            mapaPlanes[p.id] = p.nombre;
        });

        // 5. LÓGICA MANUAL PARA CALCULAR EL PLAN MÁS POPULAR
        const conteoPlanes = {};
        personasData?.forEach(per => {
            if (per.plan_id) {
                const nombrePlan = mapaPlanes[per.plan_id] || `Plan ID: ${per.plan_id}`;
                conteoPlanes[nombrePlan] = (conteoPlanes[nombrePlan] || 0) + 1;
            }
        });
        
        const planMasVendido = Object.keys(conteoPlanes).length > 0 
            ? Object.keys(conteoPlanes).reduce((a, b) => conteoPlanes[a] > conteoPlanes[b] ? a : b)
            : "Ninguno asignado aún";

        // 6. CONSTRUIR EL PROMPT PARA OLLAMA
        const datosGym = `
        Métricas reales de Gym Cúcuta:
        - Nuevas personas registradas este mes: ${nuevasPersonas || 0}
        - Plan más popular entre los miembros: ${planMasVendido}
        - Total de miembros evaluados en el sistema: ${personasData?.length || 0}
        `;

        const promptGemma = `
        Actúa como un experto analista de negocios para gimnasios.
        Analiza los siguientes datos reales de "Gym Cúcuta" y redacta un informe ejecutivo muy breve (máximo 3 párrafos), profesional, analítico y motivador para el administrador. Incluye una recomendación estratégica basada en los números.
        
        Datos:
        ${datosGym}
        `;

        // 7. ENVIAR LOS DATOS A OLLAMA (GEMMA) LOCAL
        console.log("🧠 Solicitando análisis a Gemma en Ollama...");
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'gemma',
            prompt: promptGemma,
            stream: false
        });

        const informeIA = ollamaResponse.data.response;

        // 8. ENVIAR EL INFORME FINAL A TELEGRAM
        console.log("🚀 Despachando informe a Telegram...");
        const mensajeTelegram = `📊 *INFORME INTELIGENTE - GYM CÚCUTA* 🤖\n\n${informeIA}`;
        
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: mensajeTelegram,
            parse_mode: 'Markdown'
        });

        console.log("✅ ¡Proceso completado con éxito!");
        return res.status(200).json({ 
            success: true, 
            message: "El reporte fue generado por Gemma y enviado a tu Telegram con éxito." 
        });

    } catch (error) {
        console.error("❌ Error en el proceso del Bot:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Error interno al procesar el reporte con el Bot." 
        });
    }
});

// Ruta de prueba
app.get('/api/saludo', (req, res) => {
    res.json({ mensaje: "¡El backend de Gym Cúcuta está vivo!" });
});

app.listen(PORT, () => {
    console.log("🚀 Servidor corriendo en http://localhost:" + PORT);
});