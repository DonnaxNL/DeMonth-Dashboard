import { CareProduct } from "../models/careproduct"
import { FaceMask } from "../models/facemask"
import { MenstrualProduct } from "../models/menstrualproduct"
import { Snack } from "../models/snacks"

export class Products {
    productTypesTampons = ['TR', 'TS', 'TSP']
    tamponsMaxAmount = 25
    tamponsMaxExtraAmount = 12
    tamponsShippingPrice = 199
    productTypesPads = ['PR', 'PS', 'PMR', 'PMS']
    padsMaxAmount = 16
    padsMaxExtraAmount = 5
    padsMaxiRegularShippingPrice = 235
    padsMaxiSuperShippingPrice = 245
    productTypesLiners = ['LL', 'LEL']
    linersMaxAmount = 25
    linersMaxExtraAmount = 12
    maxAmountBasic = 20
    combiShippingPrice = 229
    menstrualProductOptions = [
        { id: 'PR', item: new MenstrualProduct('PR','Regular',{id: 'pads', name: 'Pads'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-pads-regular.jpg','products.cottons_pads_regular_description')},
        { id: 'PS', item: new MenstrualProduct('PS','Super',{id: 'pads', name: 'Pads'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-pads-super.jpg','products.cottons_pads_super_description')},
        { id: 'PMR', item: new MenstrualProduct('PMR','Maxi Regular',{id: 'pads', name: 'Pads'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-pads-maxi-regular.jpg','products.cottons_pads_maxi_regular_description')},
        { id: 'PMS', item: new MenstrualProduct('PMS','Maxi Super',{id: 'pads', name: 'Pads'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-pads-maxi-super.jpg','products.cottons_pads_maxi_super_description')},
        { id: 'TR', item: new MenstrualProduct('TR','Ultra-Thin Regular',{id: 'tampons', name: 'Tampons'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-tampons-regular.jpg','products.cottons_tampon_regular_description')},
        { id: 'TS', item: new MenstrualProduct('TS','Ultra-Thin Super',{id: 'tampons', name: 'Tampons'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/products-cottons-tampons-super.jpg','products.cottons_tampon_super_description')},
        { id: 'TSP', item: new MenstrualProduct('TSP','Super Plus',{id: 'tampons', name: 'Tampons'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/products-cottons-tampons-super-plus.jpg','products.cottons_tampon_super_plus_description')},
        { id: 'LL', item: new MenstrualProduct('LL','Ultra-Thin',{id: 'liners', name: 'Liners'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-liners-light.jpg','products.cottons_pads_liners_light_description')},
        { id: 'LEL', item: new MenstrualProduct('LEL','Ultra-Thin Long',{id: 'liners', name: 'Liners'},{id: 'cottons', name: 'Cottons'},'https://demonth.nl/assets/images/products/cottons-liners-extra-long.jpg','products.cottons_pads_liners_extra_long_description')},
    ]
    chocolateOptions: Array<Snack> = [
        new Snack({id: 'tony-chocolonely', name: 'Tony\'s Chocolonely'}, 'milk', 'Melk 32%', 'https://tonyschocolonely.com/storage/configurations/tonyschocolonelycom.app/thumbnails/products/kleine_repen/512_90_80_kar_tc_melk_50gr_recht_rgb_2015.png'),
        new Snack({id: 'tony-chocolonely', name: 'Tony\'s Chocolonely'}, 'caramel', 'Melk Karamel Zeezout', 'https://tonyschocolonely.com/storage/configurations/tonyschocolonelycom.app/thumbnails/products/kleine_repen/512_90_80_kar_tc_karamel_47gr_recht_rgb_2.png'),
        new Snack({id: 'tony-chocolonely', name: 'Tony\'s Chocolonely'}, 'nougat', 'Melk Noga', 'https://tonyschocolonely.com/storage/configurations/tonyschocolonelycom.app/thumbnails/products/kleine_repen/512_90_80_kar_tc_noga_47gr_recht_rgb_2015.png'),
        new Snack({id: 'tony-chocolonely', name: 'Tony\'s Chocolonely'}, 'hazelnut', 'Melk Hazelnoot', 'https://tonyschocolonely.com/storage/configurations/tonyschocolonelycom.app/thumbnails/products/kleine_repen/512_90_80_kar_tc_hazelnoot_47gr_recht_rgb_2015_2.png'),
        new Snack({id: 'tony-chocolonely', name: 'Tony\'s Chocolonely'}, 'dark', 'Puur 70%', 'https://tonyschocolonely.com/storage/configurations/tonyschocolonelycom.app/thumbnails/products/kleine_repen/512_90_80_kar_tc_puur_50gr_recht_rgb_2015_2.png')
    ]
    healthbarOptions: Array<Snack> = [
        new Snack({id: 'rude-health', name: 'Rude Health'}, 'coconut', 'The Coconut', 'https://demonth.nl/assets/images/products/snacks/rudehealth-coconut.png'),
        new Snack({id: 'rude-health', name: 'Rude Health'}, 'peanut', 'The Peanut', 'https://demonth.nl/assets/images/products/snacks/rudehealth-peanut.png'),
        new Snack({id: 'rude-health', name: 'Rude Health'}, 'pumpkin', 'The Pumpkin', 'https://demonth.nl/assets/images/products/snacks/rudehealth-pumpkin.png'),
        new Snack({id: 'rude-health', name: 'Rude Health'}, 'sweetpotatocacao', 'Sweet Potato & Cacao', 'https://demonth.nl/assets/images/products/snacks/rudehealth-sweetpotatocacao.png'),
        new Snack({id: 'rude-health', name: 'Rude Health'}, 'beetroot', 'The Beetroot', 'https://demonth.nl/assets/images/products/snacks/rudehealth-beetroot.png')
    ]
    granolaOptions: Array<Snack> = [
        new Snack({id: 'oot', name: 'Oot'}, 'crunchynuts', 'Crunchy Nuts', 'https://www.oot.nl/wp-content/uploads/2017/03/Cruncy-Nuts-Granola-Oot.jpg'),
        new Snack({id: 'oot', name: 'Oot'}, 'cacaoboekweit', 'Cacao Boekweit', 'https://www.oot.nl/wp-content/uploads/2017/03/Cacao-Boekweit-Granola-Oot.jpg'),
        new Snack({id: 'oot', name: 'Oot'}, 'chiaspice', 'Chia Spice', 'https://www.oot.nl/wp-content/uploads/2017/03/skinny-mix-granola-oot.jpg'),
        new Snack({id: 'oot', name: 'Oot'}, 'paleomix', 'Paleo Mix', 'https://www.oot.nl/wp-content/uploads/2017/03/Paleo-mix-granola-oot.jpg'),
    ]
    skinOptions = [
        ['no_pref', 'Geen idee / Geen voorkeur'],
        ['normal', 'Normaal'],
        ['mixed', 'Gemengd/Gecombineerde'],
        ['dry', 'Droog tot zeer droog'],
        ['oil', 'Vet']
    ]
    faceMaskOptions = [
        { id: 'creme-antioxidant-berries', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['normal'], 'creme-antioxidant-berries', {nl: 'Crème masker Antioxidant & Bessen'})},
        { id: 'creme-avocado', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['normal', 'mixed', 'oil'], 'creme-avocado', {nl: 'Crème masker Avocado'})},
        { id: 'creme-bamboo-greentea', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['dry'], 'creme-bamboo-greentea', {nl: 'Crème masker Bamboe & Groene Thee'})},
        { id: 'creme-fruit-acid', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['mixed', 'oil'], 'creme-fruit-acid', {nl: 'Crème masker Fruitzuur'})},
        { id: 'creme-hyaluronic-acid', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['dry'], 'creme-hyaluronic-acid', {nl: 'Crème masker Hyaluronzuur'})},
        { id: 'creme-lava', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['oil'], 'creme-lava', {nl: 'Crème masker Lava'})},
        { id: 'creme-mango-illipe-butter', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['dry'], 'creme-mango-illipe-butter', {nl: 'Crème masker Mango- & Illipe Butter'})},
        { id: 'creme-marine-algae', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['mixed', 'oil'], 'creme-marine-algae', {nl: 'Crème masker Zeealgen'})},
        { id: 'creme-nuts', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['dry'], 'creme-nuts', {nl: 'Crème masker Noten'})},
        { id: 'creme-raspberry', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['normal', 'mixed', 'oil'], 'creme-raspberry', {nl: 'Crème masker Framboos'})},
        { id: 'creme-roses', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['normal'], 'creme-roses', {nl: 'Crème masker Rozen'})},
        { id: 'creme-shea-butter', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'creme', ['dry'], 'creme-shea-butter', {nl: 'Crème masker Shea Butter'})},
        { id: 'mud-dead-sea', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'mud', ['mixed', 'oil'], 'mud-dead-sea', {nl: 'Moddermasker Dode Zee'})},
        { id: 'peeloff-honey', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'peeloff', ['mixed', 'oil'], 'peeloff-honey', {nl: 'Peel-off masker Honing'})},
        { id: 'scrub-goji-berries', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'scrub', ['mixed', 'oil'], 'scrub-goji-berries', {nl: 'Scrubmasker Goji Bessen'})},
        { id: 'scrub-litchi', item: new FaceMask({id: 'dr-van-der-hoog', name: 'Dr. Van Der Hoog'}, 'scrub', ['mixed', 'oil'], 'scrub-litchi', {nl: 'Scrubmasker Litchi'})},
    ]
    shampooBarOptions = [
        { id: 'coconut', item: new CareProduct({id: 'shampoobar', name: 'ShampooBar'}, 'coconut', 'Kokos')},
        { id: 'honey', item: new CareProduct({id: 'shampoobar', name: 'ShampooBar'}, 'honey', 'Honing')},
        { id: 'lavendel', item: new CareProduct({id: 'shampoobar', name: 'ShampooBar'}, 'lavendel', 'Lavendel')}
    ]
    teaOptions = [
        { id: 'cinnamon', item: new CareProduct({id: 'demonth', name: 'DeMonth'}, 'cinnamon', 'Kaneelstukjes')},
        { id: 'ginger', item: new CareProduct({id: 'demonth', name: 'DeMonth'}, 'ginger', 'Gember Thee')},
        { id: 'peppermint', item: new CareProduct({id: 'demonth', name: 'DeMonth'}, 'peppermint', 'Pepermunt Thee')},
        { id: 'lemon-balm', item: new CareProduct({id: 'demonth', name: 'DeMonth'}, 'lemon-balm', 'Citroenmelisse Thee')}
    ]
    otherOptions = [
        { id: 'cotton-buds', item: new CareProduct('The Bamboo Brush Society', 'cotton-buds', 'Bamboo wattenstaafjes')},
        { id: 'wet-wipes', item: new CareProduct('Gentle Day', 'wet-wipes', 'Intieme Doekjes')},
        { id: 'glow-serum', item: new CareProduct('ALEEZA', 'glow-serum', 'Botanical Glow Serum')},
        { id: 'sponge-tampon', item: new CareProduct('Beppy', 'sponge-tampon', 'Sponstampon')}
    ]

    careProductOptions = [
        {
            id: 'normal',
            delivery: [
                ['creme-avocado', 'honey', 'cinnamon'],
                ['creme-raspberry', 'coconut', 'ginger'],
                ['creme-roses', 'lavendel', 'lemon-balm'],
                ['creme-antioxidant-berries', 'honey', 'peppermint'],
                ['creme-avocado', 'coconut', 'cinnamon'],
                ['creme-raspberry', 'lavendel', 'ginger'],
                ['creme-roses', 'honey', 'lemon-balm'],
                ['creme-antioxidant-berries', 'coconut', 'peppermint'],
                ['creme-avocado', 'lavendel', 'cinnamon'],
                ['creme-raspberry', 'honey', 'ginger'],
                ['creme-roses', 'coconut', 'lemon-balm'],
                ['creme-antioxidant-berries', 'lavendel', 'peppermint'],
            ]
        },
        {
            id: 'mixed',
            delivery: [
                ['scrub-goji-berries', 'lavendel', 'lemon-balm'],
                ['scrub-litchi', 'honey', 'cinnamon'],
                ['peeloff-honey', 'coconut', 'peppermint'],
                ['creme-avocado', 'lavendel', 'ginger'],
                ['creme-raspberry', 'honey', 'lemon-balm'],
                ['creme-fruit-acid', 'coconut', 'cinnamon'],
                ['creme-marine-algae', 'lavendel', 'peppermint'],
                ['mud-dead-sea', 'honey', 'ginger'],
                ['scrub-goji-berries', 'coconut', 'lemon-balm'],
                ['scrub-litchi', 'lavendel', 'cinnamon'],
                ['peeloff-honey', 'honey', 'peppermint'],
                ['creme-avocado', 'coconut', 'ginger'],
            ]
        },
        {
            id: 'dry',
            delivery: [
                ['creme-hyaluronic-acid', 'coconut', 'peppermint'],
                ['creme-mango-illipe-butter', 'lavendel', 'lemon-balm'],
                ['creme-nuts', 'honey', 'ginger'],
                ['creme-bamboo-greentea', 'coconut', 'cinnamon'],
                ['creme-shea-butter', 'lavendel', 'peppermint'],
                ['creme-hyaluronic-acid', 'honey', 'lemon-balm'],
                ['creme-mango-illipe-butter', 'coconut', 'ginger'],
                ['creme-nuts', 'lavendel', 'cinnamon'],
                ['creme-bamboo-greentea', 'honey', 'peppermint'],
                ['creme-shea-butter', 'coconut', 'lemon-balm'],
                ['creme-hyaluronic-acid', 'lavendel', 'ginger'],
                ['creme-mango-illipe-butter', 'honey', 'cinnamon'],
            ]
        },
        {
            id: 'oil',
            delivery: [
                ['creme-avocado', 'coconut', 'ginger'],
                ['creme-raspberry', 'lavendel', 'peppermint'],
                ['creme-fruit-acid', 'honey', 'cinnamon'],
                ['creme-lava', 'coconut', 'lemon-balm'],
                ['creme-marine-algae', 'lavendel', 'ginger'],
                ['mud-dead-sea', 'honey', 'peppermint'],
                ['peeloff-honey', 'coconut', 'cinnamon'],
                ['scrub-goji-berries', 'lavendel', 'lemon-balm'],
                ['scrub-litchi', 'honey', 'ginger'],
                ['creme-avocado', 'coconut', 'peppermint'],
                ['creme-raspberry', 'lavendel', 'cinnamon'],
                ['creme-fruit-acid', 'honey', 'lemon-balm']
            ]
        },
    ]
}