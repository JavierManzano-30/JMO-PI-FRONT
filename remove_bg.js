import { Jimp } from 'jimp';

async function main() {
  try {
    const image = await Jimp.read('src/assets/logo_propio.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      const brightness = (red + green + blue) / 3;
      if (brightness > 215) {
          let alpha = 255 - ((brightness - 215) * (255 / 40));
          if (alpha < 0) alpha = 0;
          this.bitmap.data[idx + 3] = alpha;
      }
    });
    await image.write('src/assets/logo_propio_transparente.png');
    console.log("Background removed successfully!");
  } catch (err) {
    console.error("Error processing image:", err);
  }
}
main();
