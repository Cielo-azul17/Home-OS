import { AssetCategory } from './models';

/* Generic placeholder images for rooms and products.
   These are simple, modern, and distinctive by type.
   Users can upload real photos anytime. */

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

  /* Room placeholders */

  private static kitchenPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f5f1e8' width='400' height='300'/%3E
      %3Crect x='40' y='120' width='120' height='100' fill='%23d4a574' stroke='%23a0826d' stroke-width='2'/%3E
      %3Crect x='100' y='140' width='40' height='60' fill='%23888' stroke='%23555' stroke-width='1'/%3E
      %3Crect x='160' y='100' width='180' height='30' fill='%23c4b5a0' stroke='%23998877' stroke-width='2'/%3E
      %3Crect x='170' y='120' width='25' height='25' fill='%23e8e4dc'/%3E
      %3Crect x='205' y='120' width='25' height='25' fill='%23e8e4dc'/%3E
      %3Crect x='240' y='120' width='25' height='25' fill='%23e8e4dc'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EKitchen%3C/text%3E
      %3C/svg%3E`;
  }

  private static livingRoomPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23ede9e4' width='400' height='300'/%3E
      %3Crect x='60' y='100' width='140' height='100' fill='%236b5b52' stroke='%23443c35' stroke-width='2'/%3E
      %3Crect x='250' y='80' width='100' height='90' fill='%23333' stroke='%23111' stroke-width='2'/%3E
      %3Crect x='260' y='90' width='80' height='70' fill='%231a1a1a'/%3E
      %3Crect x='70' y='110' width='30' height='30' fill='%238b7355'/%3E
      %3Crect x='155' y='110' width='30' height='30' fill='%238b7355'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3ELiving Room%3C/text%3E
      %3C/svg%3E`;
  }

  private static bedroomPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f0e8e4' width='400' height='300'/%3E
      %3Crect x='80' y='100' width='160' height='120' fill='%23d4a5a5' stroke='%23a0767a' stroke-width='2'/%3E
      %3Crect x='100' y='120' width='120' height='80' fill='%23e8c4b8' stroke='%23c0a098' stroke-width='1'/%3E
      %3Crect x='250' y='140' width='80' height='60' fill='%23a0926b' stroke='%23786d52' stroke-width='2'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EBedroom%3C/text%3E
      %3C/svg%3E`;
  }

  private static bathroomPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23ecf2f7' width='400' height='300'/%3E
      %3Crect x='60' y='110' width='120' height='100' fill='%23e0f2f7' stroke='%236ba3c0' stroke-width='2'/%3E
      %3Crect x='75' y='130' width='90' height='70' fill='%23fff' stroke='%23ccc' stroke-width='1'/%3E
      %3Crect x='220' y='100' width='120' height='110' fill='%23f0f0f0' stroke='%23999' stroke-width='2'/%3E
      %3Crect x='240' y='130' width='80' height='60' fill='%23ddd'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EBathroom%3C/text%3E
      %3C/svg%3E`;
  }

  private static studyPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f5f3f0' width='400' height='300'/%3E
      %3Crect x='50' y='80' width='100' height='140' fill='%238b7355' stroke='%23654321' stroke-width='2'/%3E
      %3Crect x='65' y='100' width='70' height='100' fill='%23d4a574'/%3E
      %3Crect x='70' y='110' width='60' height='15' fill='%23666'/%3E
      %3Crect x='70' y='130' width='60' height='15' fill='%23888'/%3E
      %3Crect x='70' y='150' width='60' height='15' fill='%23666'/%3E
      %3Crect x='200' y='100' width='140' height='110' fill='%23bbb8b3' stroke='%23888' stroke-width='2'/%3E
      %3Crect x='210' y='115' width='50' height='70' fill='%23fff'/%3E
      %3Crect x='280' y='115' width='50' height='70' fill='%23f5f5f5'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EStudy%3C/text%3E
      %3C/svg%3E`;
  }

  private static diningPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f4f0eb' width='400' height='300'/%3E
      %3Ccircle cx='200' cy='140' r='60' fill='%23a0826d' stroke='%23776655' stroke-width='2'/%3E
      %3Crect x='70' y='90' width='60' height='100' fill='%238b7355' stroke='%23654321' stroke-width='1'/%3E
      %3Crect x='270' y='90' width='60' height='100' fill='%238b7355' stroke='%23654321' stroke-width='1'/%3E
      %3Crect x='140' y='180' width='120' height='50' fill='%23c4b5a0' stroke='%23998877' stroke-width='2'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EDining%3C/text%3E
      %3C/svg%3E`;
  }

  private static garagePlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23d0d0d0' width='400' height='300'/%3E
      %3Crect x='80' y='80' width='240' height='140' fill='%23999' stroke='%23555' stroke-width='2'/%3E
      %3Crect x='100' y='100' width='200' height='100' fill='%23333'/%3E
      %3Crect x='120' y='120' width='40' height='60' fill='%23666'/%3E
      %3Crect x='180' y='120' width='40' height='60' fill='%23666'/%3E
      %3Crect x='240' y='120' width='40' height='60' fill='%23666'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3EGarage%3C/text%3E
      %3C/svg%3E`;
  }

  private static genericRoomPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f0ebe5' width='400' height='300'/%3E
      %3Crect x='60' y='80' width='280' height='160' fill='%23e8dfd5' stroke='%23c0b0a0' stroke-width='2'/%3E
      %3Crect x='80' y='100' width='80' height='80' fill='%23d4c4b4' stroke='%23a0908a' stroke-width='1'/%3E
      %3Crect x='180' y='100' width='80' height='80' fill='%23d4c4b4' stroke='%23a0908a' stroke-width='1'/%3E
      %3Crect x='280' y='100' width='40' height='120' fill='%23c0b8b0' stroke='%23908880' stroke-width='1'/%3E
      %3Ctext x='200' y='260' font-size='16' font-family='Arial' text-anchor='middle' fill='%23666'%3ERoom%3C/text%3E
      %3C/svg%3E`;
  }

  /* Asset/Product placeholders */

  private static electronicsPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f5f5f5' width='400' height='300'/%3E
      %3Crect x='80' y='40' width='240' height='180' fill='%23111' stroke='%23333' stroke-width='2'/%3E
      %3Crect x='90' y='50' width='220' height='160' fill='%231a1a1a'/%3E
      %3Crect x='100' y='60' width='200' height='140' fill='%23333' opacity='0.7'/%3E
      %3Crect x='150' y='230' width='100' height='15' fill='%23666'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EElectronics%3C/text%3E
      %3C/svg%3E`;
  }

  private static appliancesPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f8f6f2' width='400' height='300'/%3E
      %3Crect x='70' y='50' width='260' height='200' fill='%23ddd' stroke='%23999' stroke-width='2'/%3E
      %3Crect x='90' y='70' width='220' height='160' fill='%23f0f0f0'/%3E
      %3Crect x='100' y='85' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Crect x='170' y='85' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Crect x='240' y='85' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Crect x='100' y='155' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Crect x='170' y='155' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Crect x='240' y='155' width='50' height='50' fill='%23ccc' stroke='%23999'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EAppliances%3C/text%3E
      %3C/svg%3E`;
  }

  private static climatePlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23e8f4ff' width='400' height='300'/%3E
      %3Crect x='100' y='60' width='200' height='150' fill='%23f0f8ff' stroke='%236ba3c0' stroke-width='2'/%3E
      %3Crect x='120' y='80' width='160' height='110' fill='%23fff' stroke='%23cce0ff'/%3E
      %3Ccircle cx='150' cy='120' r='12' fill='%2387ceeb'/%3E
      %3Ccircle cx='180' cy='130' r='10' fill='%2387ceeb'/%3E
      %3Ccircle cx='210' cy='125' r='11' fill='%2387ceeb'/%3E
      %3Ccircle cx='240' cy='135' r='9' fill='%2387ceeb'/%3E
      %3Crect x='120' y='170' width='160' height='10' fill='%23cce0ff'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EClimate%3C/text%3E
      %3C/svg%3E`;
  }

  private static kitchenAppliancePlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23faf8f5' width='400' height='300'/%3E
      %3Crect x='100' y='50' width='200' height='180' fill='%23e0e0e0' stroke='%23888' stroke-width='2'/%3E
      %3Crect x='120' y='70' width='160' height='140' fill='%23f5f5f5'/%3E
      %3Crect x='130' y='90' width='50' height='60' fill='%23ddd' stroke='%23999'/%3E
      %3Crect x='195' y='90' width='50' height='60' fill='%23ddd' stroke='%23999'/%3E
      %3Crect x='130' y='165' width='115' height='30' fill='%23888'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EKitchen%3C/text%3E
      %3C/svg%3E`;
  }

  private static furniturePlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f5f1eb' width='400' height='300'/%3E
      %3Crect x='80' y='80' width='240' height='140' fill='%238b7355' stroke='%23654321' stroke-width='2'/%3E
      %3Crect x='100' y='100' width='200' height='100' fill='%23d4a5a5' stroke='%23a0767a'/%3E
      %3Crect x='85' y='220' width='40' height='30' fill='%23654321'/%3E
      %3Crect x='135' y='220' width='40' height='30' fill='%23654321'/%3E
      %3Crect x='225' y='220' width='40' height='30' fill='%23654321'/%3E
      %3Crect x='275' y='220' width='40' height='30' fill='%23654321'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EFurniture%3C/text%3E
      %3C/svg%3E`;
  }

  private static genericItemPlaceholder(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E
      %3Crect fill='%23f5f5f5' width='400' height='300'/%3E
      %3Crect x='100' y='60' width='200' height='180' fill='%23e8e8e8' stroke='%23bbb' stroke-width='2'/%3E
      %3Crect x='120' y='80' width='160' height='140' fill='%23f5f5f5'/%3E
      %3Crect x='130' y='100' width='30' height='80' fill='%23ccc'/%3E
      %3Crect x='170' y='90' width='60' height='100' fill='%23ddd'/%3E
      %3Crect x='240' y='100' width='30' height='80' fill='%23ccc'/%3E
      %3Ctext x='200' y='280' font-size='14' font-family='Arial' text-anchor='middle' fill='%23666'%3EProduct%3C/text%3E
      %3C/svg%3E`;
  }
}
