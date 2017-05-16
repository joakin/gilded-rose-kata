class Item {
  constructor(name, sellIn, quality) {
    this.name = name;
    this.sellIn = sellIn;
    this.quality = quality;
  }
}

class ShopItem extends Item {
  _decreaseQuality(amount = 1) {
    this.quality = Math.max(0, this.quality - amount);
  }

  _increaseQuality(amount = 1) {
    this.quality = Math.min(50, this.quality + amount);
  }

  _decreaseSellIn() {
    this.sellIn = this.sellIn - 1;
  }

  dayPassed() {
    this._decreaseSellIn();
  }

  updateQuality() {
    this._decreaseQuality();
    if (this.sellIn <= 0) {
      this._decreaseQuality();
    }
  }

  toJSON() {
    return {
      name: this.name,
      sellIn: this.sellIn,
      quality: this.quality
    };
  }
}

class AgedBrie extends ShopItem {
  updateQuality() {
    if (this.sellIn >= 0) {
      this._increaseQuality();
    } else {
      this._increaseQuality(2);
    }
  }
}

class BackstagePasses extends ShopItem {
  updateQuality() {
    if (this.sellIn >= 10) {
      this._increaseQuality();
    } else if (this.sellIn >= 5) {
      this._increaseQuality(2);
    } else if (this.sellIn >= 0) {
      this._increaseQuality(3);
    } else {
      this.quality = 0;
    }
  }
}

class Sulfuras extends ShopItem {
  dayPassed() {
    // NOOP
  }

  updateQuality() {
    // NOOP
  }
}

class Shop {
  constructor(items = []) {
    this.items = items.map(item => {
      switch (item.name) {
        case Shop.names.AGED_BRIE:
          return new AgedBrie(item.name, item.sellIn, item.quality);

        case Shop.names.BACKSTAGE_PASSES:
          return new BackstagePasses(item.name, item.sellIn, item.quality);

        case Shop.names.SULFURAS:
          return new Sulfuras(item.name, item.sellIn, item.quality);

        default:
          return new ShopItem(item.name, item.sellIn, item.quality);
      }
    });
  }

  updateQuality() {
    this.items.forEach(item => {
      item.dayPassed();
      item.updateQuality();
    });

    return this.items;
  }
}

Shop.names = {
  AGED_BRIE: 'Aged Brie',
  BACKSTAGE_PASSES: 'Backstage passes to a TAFKAL80ETC concert',
  SULFURAS: 'Sulfuras, Hand of Ragnaros'
};

// Tests
var assert = require('assert');

describe('Shop', _ => {
  it('accepts an array of items', _ => {
    assert.equal(new Shop([]).updateQuality().constructor, Array);
  });

  describe(Shop.names.AGED_BRIE, _ => {
    it('increases quality when older and expires day-by-day', _ => {
      const brie = new Item(Shop.names.AGED_BRIE, 10, 20);
      const shop = new Shop([brie]);

      shop.updateQuality();

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.AGED_BRIE,
        sellIn: 9,
        quality: 21
      });
    });

    it('has a maximum quality of 50', _ => {
      const brie = new Item(Shop.names.AGED_BRIE, 20, 40);
      const shop = new Shop([brie]);

      for (let i = 0; i < 30; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.AGED_BRIE,
        sellIn: -10,
        quality: 50
      });
    });

    it('increases quality double as fast when sellIn is over', _ => {
      const brie = new Item(Shop.names.AGED_BRIE, 5, 10);
      const shop = new Shop([brie]);

      for (let i = 0; i < 10; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.AGED_BRIE,
        sellIn: -5,
        quality: 25
      });
    });
  });

  describe(Shop.names.BACKSTAGE_PASSES, _ => {
    it('increases quality when older and expires day-by-day', _ => {
      const passes = new Item(Shop.names.BACKSTAGE_PASSES, 20, 20);
      const shop = new Shop([passes]);

      shop.updateQuality();
      shop.updateQuality();

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.BACKSTAGE_PASSES,
        sellIn: 18,
        quality: 22
      });
    });

    it('has a maximum quality of 50', _ => {
      const passes = new Item(Shop.names.BACKSTAGE_PASSES, 50, 40);
      const shop = new Shop([passes]);

      for (let i = 0; i < 30; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.BACKSTAGE_PASSES,
        sellIn: 20,
        quality: 50
      });
    });

    it('drops quality to zero when sellIn is over', _ => {
      const passes = new Item(Shop.names.BACKSTAGE_PASSES, 5, 10);
      const shop = new Shop([passes]);

      for (let i = 0; i < 10; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.BACKSTAGE_PASSES,
        sellIn: -5,
        quality: 0
      });
    });

    it('increases quality x2 less than 10 days to when sellIn is over', _ => {
      const passes = new Item(Shop.names.BACKSTAGE_PASSES, 15, 10);
      const shop = new Shop([passes]);

      for (let i = 0; i < 10; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.BACKSTAGE_PASSES,
        sellIn: 5,
        quality: 10 + 5 + 5 * 2
      });
    });

    it('increases quality x3 less than 5 days to when sellIn is over', _ => {
      const passes = new Item(Shop.names.BACKSTAGE_PASSES, 5, 10);
      const shop = new Shop([passes]);

      for (let i = 0; i < 5; i++) {
        shop.updateQuality();
      }

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.BACKSTAGE_PASSES,
        sellIn: 0,
        quality: 10 + 5 * 3
      });
    });
  });

  describe(Shop.names.SULFURAS, _ => {
    it('maintains quality day by day and is unperishable', _ => {
      const item = new Item(Shop.names.SULFURAS, 10, 20);
      const shop = new Shop([item]);

      shop.updateQuality();
      shop.updateQuality();
      shop.updateQuality();
      shop.updateQuality();

      assert.deepEqual(shop.items[0].toJSON(), {
        name: Shop.names.SULFURAS,
        sellIn: 10,
        quality: 20
      });
    });
  });

  describe('Other random item', _ => {
    it('decreases quality every day', _ => {
      const item = new Item('Something random', 10, 20);
      const shop = new Shop([item]);

      shop.updateQuality();

      assert.deepEqual(shop.items[0].toJSON(), {
        name: 'Something random',
        sellIn: 9,
        quality: 19
      });
    });

    it('maintains a minimum quality of 0', _ => {
      const item = new Item('Something random', 10, 3);
      const shop = new Shop([item]);

      shop.updateQuality();
      shop.updateQuality();
      shop.updateQuality();
      shop.updateQuality();

      assert.deepEqual(shop.items[0].toJSON(), {
        name: 'Something random',
        sellIn: 6,
        quality: 0
      });
    });
  });
});

/*
 *
 *
 *
 *
 *
 *
 * Micro sync test framework
 */

var testData;

function it(subject, exec) {
  try {
    exec();
    process.stdout.write('.');
    // console.error('✅ it ' + subject);
  } catch (e) {
    testLog('❌ it ' + subject);
    throw e;
  }
}

function describe(subject, fn) {
  testData = testData || {
    level: -1
  };
  testData.level++;

  if (testData.level > 0) {
    console.log('\n');
  }
  testLog('# ' + subject);
  process.stdout.write(getPadding(testData.level + 2));
  fn();
  testData.level--;
  if (testData.level === -1) {
    console.log('\n');
  }
}

function testLog(str) {
  console.log(getPadding(testData.level) + str);
}

function getPadding(level) {
  return Array(level).fill(' ').join('');
}
