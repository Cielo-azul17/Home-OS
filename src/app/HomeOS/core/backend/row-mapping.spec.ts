import {
  dataUrlToBlob,
  isStoragePath,
  safeName,
  toActivity,
  toAsset,
  toDocument,
  toExpense,
  toReminder,
  toRoom,
  toServiceRecord,
} from './row-mapping';

/* This is the layer that only runs against a real project, so it's the layer
   most likely to be wrong and least likely to be noticed. The rows below are
   shaped exactly as PostgREST returns them: snake_case, nulls rather than
   undefined, and numerics as strings. */

describe('isStoragePath', () => {
  it('accepts a bucket-relative path', () => {
    expect(isStoragePath('user-123/abc-invoice.pdf')).toBe(true);
  });

  it('rejects anything already a URL', () => {
    expect(isStoragePath('https://example.com/a.jpg')).toBe(false);
    expect(isStoragePath('http://example.com/a.jpg')).toBe(false);
    // Seeded mock images must not be sent to Storage for signing.
    expect(isStoragePath('data:image/png;base64,AAAA')).toBe(false);
    expect(isStoragePath('/images/hero-banner.png')).toBe(false);
  });

  it('rejects empty and non-strings', () => {
    expect(isStoragePath('')).toBe(false);
    expect(isStoragePath(null)).toBe(false);
    expect(isStoragePath(undefined)).toBe(false);
  });
});

describe('toAsset', () => {
  const row = {
    id: 'uuid-1',
    name: 'LG Fridge',
    brand: 'LG',
    category: 'Appliances',
    room_id: 'uuid-room',
    image: 'user/abc.jpg',
    purchase_date: '2026-01-15',
    purchase_price: '42990.00',
    warranty_expiry: '2028-01-15',
    serial_number: '502KARZ001234',
    notes: null,
  };

  it('maps columns to the domain model', () => {
    const asset = toAsset(row, 'https://signed', []);

    expect(asset.roomId).toBe('uuid-room');
    expect(asset.serialNumber).toBe('502KARZ001234');
    expect(asset.warrantyExpiry).toBe('2028-01-15');
    expect(asset.image).toBe('https://signed');
  });

  it('converts numeric strings to numbers', () => {
    // '42990.00' would break every total if it stayed a string.
    const asset = toAsset(row, undefined, []);
    expect(asset.purchasePrice).toBe(42990);
    expect(typeof asset.purchasePrice).toBe('number');
  });

  it('turns nulls into undefined so optional fields stay optional', () => {
    const asset = toAsset({ ...row, brand: null, purchase_price: null, notes: null }, undefined, []);

    expect(asset.brand).toBeUndefined();
    expect(asset.purchasePrice).toBeUndefined();
    expect(asset.notes).toBeUndefined();
  });

  it('keeps a price of zero rather than dropping it', () => {
    const asset = toAsset({ ...row, purchase_price: '0' }, undefined, []);
    expect(asset.purchasePrice).toBe(0);
  });

  it('survives an asset whose room was deleted', () => {
    // ON DELETE SET NULL leaves room_id null; the UI expects a string.
    const asset = toAsset({ ...row, room_id: null }, undefined, []);
    expect(asset.roomId).toBe('');
  });

  it('carries the service history it is given', () => {
    const history = [toServiceRecord({ id: 's1', kind: 'repair', title: 'Fixed', date: '2026-02-01', cost: '1500' })];
    const asset = toAsset(row, undefined, history);

    expect(asset.history.length).toBe(1);
    expect(asset.history[0].cost).toBe(1500);
  });
});

describe('toReminder', () => {
  it('maps due_date and completed', () => {
    const reminder = toReminder({
      id: 'r1',
      title: 'Service AC',
      asset_id: 'a1',
      due_date: '2026-10-01',
      repeat: 'yearly',
      completed: false,
      notes: null,
    });

    expect(reminder.dueDate).toBe('2026-10-01');
    expect(reminder.assetId).toBe('a1');
    expect(reminder.repeat).toBe('yearly');
    expect(reminder.completed).toBe(false);
    expect(reminder.notes).toBeUndefined();
  });

  it('leaves a household reminder unlinked', () => {
    const reminder = toReminder({ id: 'r1', title: 'Bill', asset_id: null, due_date: '2026-10-01', repeat: 'none', completed: false });
    expect(reminder.assetId).toBeUndefined();
  });
});

describe('toExpense', () => {
  it('converts the amount to a number', () => {
    const expense = toExpense({ id: 'e1', title: 'Power', amount: '1234.50', date: '2026-09-01', category: 'Utilities', asset_id: null });

    expect(expense.amount).toBe(1234.5);
    expect(expense.assetId).toBeUndefined();
  });
});

describe('toDocument', () => {
  const row = {
    id: 'd1',
    title: 'LG invoice',
    kind: 'Invoice',
    asset_id: 'a1',
    added_date: '2026-09-01',
    file_name: 'invoice.pdf',
    size_label: '210 KB',
    storage_path: 'user/abc-invoice.pdf',
    mime_type: 'application/pdf',
  };

  it('takes the signed URL rather than the stored path', () => {
    // The viewer opens fileUrl directly; a bucket path would 404.
    const doc = toDocument(row, 'https://signed-url');
    expect(doc.fileUrl).toBe('https://signed-url');
    expect(doc.fileName).toBe('invoice.pdf');
    expect(doc.mimeType).toBe('application/pdf');
  });

  it('leaves fileUrl undefined when signing failed', () => {
    const doc = toDocument(row, undefined);
    expect(doc.fileUrl).toBeUndefined();
  });

  it('defaults a missing size label to empty rather than undefined', () => {
    const doc = toDocument({ ...row, size_label: null }, undefined);
    expect(doc.sizeLabel).toBe('');
  });
});

describe('toRoom', () => {
  it('gives a room without a photo an empty image, not null', () => {
    // The card checks truthiness to pick its fallback tile.
    expect(toRoom({ id: 'r', name: 'Study', image: null }).image).toBe('');
  });
});

describe('toActivity', () => {
  it('trims a timestamp down to a plain date', () => {
    const entry = toActivity({
      id: 'ac1',
      icon: 'box',
      title: 'Added a TV',
      context: 'Living room',
      at: '2026-09-20T14:33:07.123456+00:00',
    });

    expect(entry.at).toBe('2026-09-20');
  });

  it('defaults a missing context', () => {
    expect(toActivity({ id: 'a', icon: 'box', title: 'x', context: null, at: '2026-09-20T00:00:00Z' }).context).toBe('');
  });
});

describe('dataUrlToBlob', () => {
  it('recovers the bytes and the type', async () => {
    // "Hi" in base64.
    const blob = dataUrlToBlob('data:text/plain;base64,SGk=');

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(2);
    expect(await blob.text()).toBe('Hi');
  });

  it('reads a PDF as a PDF, not an image', () => {
    // The Smart Add flow used to hardcode image/jpeg for every upload.
    expect(dataUrlToBlob('data:application/pdf;base64,JVBERi0=').type).toBe('application/pdf');
  });

  it('falls back when no type is declared', () => {
    expect(dataUrlToBlob('data:;base64,SGk=').type).toBe('application/octet-stream');
  });

  it('rejects anything that is not a data URL', () => {
    expect(() => dataUrlToBlob('https://example.com/a.jpg')).toThrow('Not a data URL');
  });
});

describe('safeName', () => {
  it('replaces characters a storage key cannot hold', () => {
    expect(safeName('LG Fridge Invoice (final).pdf')).toBe('LG-Fridge-Invoice--final-.pdf');
  });

  it('keeps dots, dashes and underscores', () => {
    expect(safeName('my_invoice-2026.v2.pdf')).toBe('my_invoice-2026.v2.pdf');
  });

  it('truncates from the end so the extension survives', () => {
    const long = `${'a'.repeat(200)}.pdf`;
    const result = safeName(long);

    expect(result.length).toBe(60);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('never returns an empty key', () => {
    expect(safeName('!!!')).toBe('---');
    expect(safeName('')).toBe('file');
  });
});
