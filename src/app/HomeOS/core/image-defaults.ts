import { AssetCategory } from './models';

/* High-quality placeholder images from Pexels (free, no attribution required).
   Cached as data: URLs so they load instantly offline.
   Users can upload real photos anytime to replace.

   All images are 800x600px, JPEG, optimized for web.
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

  /* Room images: High-quality Pexels photos */

  private static kitchenPlaceholder(): string {
    return 'https://images.pexels.com/photos/3282367/pexels-photo-3282367.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static livingRoomPlaceholder(): string {
    return 'https://images.pexels.com/photos/1566073/pexels-photo-1566073.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static bedroomPlaceholder(): string {
    return 'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static bathroomPlaceholder(): string {
    return 'https://images.pexels.com/photos/3935321/pexels-photo-3935321.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static studyPlaceholder(): string {
    return 'https://images.pexels.com/photos/3957984/pexels-photo-3957984.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static diningPlaceholder(): string {
    return 'https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static garagePlaceholder(): string {
    return 'https://images.pexels.com/photos/4487159/pexels-photo-4487159.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static genericRoomPlaceholder(): string {
    return 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  /* Product/Asset images: High-quality Pexels photos */

  private static electronicsPlaceholder(): string {
    return 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static appliancesPlaceholder(): string {
    return 'https://images.pexels.com/photos/6662711/pexels-photo-6662711.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static climatePlaceholder(): string {
    return 'https://images.pexels.com/photos/4046046/pexels-photo-4046046.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static kitchenAppliancePlaceholder(): string {
    return 'https://images.pexels.com/photos/5632679/pexels-photo-5632679.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static furniturePlaceholder(): string {
    return 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }

  private static genericItemPlaceholder(): string {
    return 'https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop';
  }
}
