# Finanzas 360

Aplicación web para reunir actualidad financiera y controlar manualmente una cartera de acciones, ETF y fondos de inversión.

## Estado actual

El primer prototipo incluye:

- resumen del patrimonio y rentabilidad;
- cartera con operaciones manuales persistidas en el navegador;
- acciones, ETF y fondos, identificables por ticker e ISIN;
- sección de noticias filtrable por categoría;
- perfil y preferencias en EUR para España;
- diseño adaptable a escritorio y móvil.
- instalación como PWA desde la pantalla de inicio y caché básica sin conexión;
- publicación automática en GitHub Pages después de cada cambio en `main`.
- acceso mediante cuenta de Google con Firebase Authentication;
- sesión persistente y cartera local separada por usuario.
- buscador mundial desde 3 caracteres para acciones, ETF y fondos, conectado a Twelve Data y con respaldo local de identificadores validados mediante OpenFIGI.

La aplicación no incluye posiciones, rentabilidades, noticias ni cotizaciones de demostración. Arranca vacía y solo muestra datos introducidos por el usuario o procedentes de proveedores reales.

## Desarrollo local

```bash
npm install
npm run dev
```

Para verificar la versión de producción:

```bash
npm run build
npm run preview
```

## Acceso desde el móvil

La aplicación sigue el mismo sistema que Birrómetro. Al enviar la rama `main` a GitHub, la acción **Publicar Finanzas 360** compila la aplicación y la publica en GitHub Pages.

Después de activar **Settings → Pages → Source: GitHub Actions** en el repositorio:

- Android/Chrome: abre la URL, toca el menú y elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
- iPhone/Safari: abre la URL, toca **Compartir** y elige **Añadir a pantalla de inicio**.

La aplicación se abrirá sin la interfaz del navegador y conservará una copia básica para poder arrancar sin conexión.

## Datos y servicios previstos

- **Firebase Authentication:** acceso con correo y Google.
- **Proyecto Firebase:** `finanzas-360-antrodmar3` con Google como proveedor inicial.
- **Cloud Firestore:** perfiles, carteras y operaciones por usuario.
- **Firebase Functions:** proxy privado, normalización y caché de proveedores.
- **Alpha Vantage:** primera opción gratuita para búsqueda, series diarias y noticias.
- **Twelve Data:** búsqueda mundial de acciones, ETF y fondos en más de 50 países; se usa su acceso público de demostración durante el prototipo.
- **Entrada manual:** respaldo cuando un fondo español no esté cubierto por una API gratuita.

El modelo interno utiliza ISIN además del símbolo porque muchos fondos europeos no cuentan con un ticker universal.

## Siguientes fases

1. Crear el proyecto Firebase y conectar autenticación.
2. Migrar la cartera local a Firestore con reglas de seguridad por usuario.
3. Implementar funciones `searchAssets`, `getHistoricalPrice`, `getLatestPrice` y `getNews`.
4. Obtener el precio de cierre de la fecha de compra (o la sesión anterior si no hubo mercado).
5. Añadir compras sucesivas, ventas, comisiones, dividendos y cambio de divisa.
6. Configurar GitHub Actions, Firebase Hosting y pruebas.

## Configuración

Copia `.env.example` a `.env.local` para la configuración pública de Firebase. Las claves de mercado se guardarán como secretos de Firebase Functions y nunca deberán utilizar el prefijo `VITE_`.

## Aviso

La aplicación tiene fines informativos y de seguimiento. No constituye asesoramiento financiero.
