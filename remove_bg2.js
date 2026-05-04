import { Jimp } from 'jimp';

async function main() {
  try {
    const image = await Jimp.read('src/assets/logo-propio.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      const brightness = (red + green + blue) / 3;
      const variance = Math.abs(red - green) + Math.abs(red - blue) + Math.abs(green - blue);
      
      // El fondo de tablero de ajedrez falso suele ser blanco (>240) y gris claro (~200).
      // El color "teal" oscuro es muy bajo en brillo, y el dorado tiene mucha "variance" (ej: rojo y azul son muy distintos).
      // Por tanto, si es brillante y es un tono grisáceo, lo hacemos transparente.
      if (brightness > 180 && variance < 30) {
          // Si es gris claro del tablero, la opacidad la ponemos a 0
          this.bitmap.data[idx + 3] = 0;
      } else if (brightness > 180 && variance >= 30) {
          // Si por alguna razón los bordes del dorado tienen antialiasing blanco...
          // No hacemos nada para no destruir el dorado.
      } else if (brightness > 160 && variance < 30) {
          // Transición suave para los bordes antialiasing del fondo
          let alpha = 255 - ((brightness - 160) * (255 / 20));
          if (alpha < 0) alpha = 0;
          this.bitmap.data[idx + 3] = alpha;
      }
    });
    await image.write('src/assets/logo-propio-transparente.png');
    console.log("Background removed successfully!");
  } catch (err) {
    console.error("Error processing image:", err);
  }
}
main();
