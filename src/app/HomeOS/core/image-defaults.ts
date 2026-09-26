import { AssetCategory } from './models';

/* High-quality placeholder images from Unsplash (free, no attribution required).
   Reliable CDN with excellent CORS support.
   Users can upload real photos anytime to replace.

   All images are responsive, optimized for web.
   Selected for distinctiveness by room/category type. */

export class ImageDefaults {
  static roomImage(roomName: string): string {
    const name = roomName.toLowerCase();

    if (name.includes('kitchen')) return ImageDefaults.kitchenPlaceholder();
    if (name.includes('living') || name.includes('lounge')) return ImageDefaults.livingRoomPlaceholder();
    if (name.includes('bedroom') || name.includes('master')) return ImageDefaults.bedroomPlaceholder();
    if (name.includes('bathroom') || name.includes('bath')) return ImageDefaults.bathroomPlaceholder();
    if (name.includes('study') || name.includes('office') || name.includes('work')) return ImageDefaults.studyPlaceholder();
    if (name.includes('garage')) return ImageDefaults.garagePlaceholder();
    if (name.includes('dining')) return ImageDefaults.diningPlaceholder();

    return ImageDefaults.genericRoomPlaceholder();
  }

  static assetImage(category: AssetCategory): string {
    switch (category) {
      case 'Electronics':
        return ImageDefaults.electronicsPlaceholder();
      case 'Appliances':
        return ImageDefaults.appliancesPlaceholder();
      case 'Climate':
        return ImageDefaults.climatePlaceholder();
      case 'Kitchen':
        return ImageDefaults.kitchenAppliancePlaceholder();
      case 'Furniture':
        return ImageDefaults.furniturePlaceholder();
      case 'Other':
      default:
        return ImageDefaults.genericItemPlaceholder();
    }
  }

  /* Room images: Unsplash photos with reliable CORS */

  private static kitchenPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80';
  }

  private static livingRoomPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80';
  }

  private static bedroomPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80';
  }

  private static bathroomPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80';
  }

  private static studyPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';
  }

  private static diningPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1517248135467-4d71bcdd2d59?w=800&q=80';
  }

  private static garagePlaceholder(): string {
    return 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800&q=80';
  }

  private static genericRoomPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80';
  }

  /* Product/Asset images: Unsplash photos */

  private static electronicsPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=800&q=80';
  }

  private static appliancesPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1584622714792-5f5c8b2d3e8f?w=800&q=80';
  }

  private static climatePlaceholder(): string {
    return 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80';
  }

  private static kitchenAppliancePlaceholder(): string {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80';
  }

  private static furniturePlaceholder(): string {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';
  }

  private static genericItemPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80';
  }
}
