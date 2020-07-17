const BITS_PER_ONE: usize = 4;

pub trait Modulated: Sized {
    fn modulate(&self) -> String;
    fn demodulate(s: &str) -> (Self, &str);
}

#[derive(Eq, PartialEq, Debug)]
pub enum Item {
    Number(i64),
    Nil(),
    Pair(Box<(Item, Item)>),
}

impl Item {
    fn pair(a: Item, b: Item) -> Item {
        Item::Pair(Box::new((a, b)))
    }
}

impl Modulated for i64 {
    fn modulate(&self) -> String {
        let sign = if self.is_negative() { "10" } else { "01" };

        let repr = if *self == 0i64 {
            String::new()
        } else {
            format!("{:b}", self.abs())
        };
        let ones = if *self == 0i64 {
            0
        } else {
            (repr.len() + BITS_PER_ONE - 1) / BITS_PER_ONE // div и округление вверх
        };

        // нули, которых не хватает в repr
        let prefix = if *self == 0i64 {
            String::new()
        } else {
            "0".repeat(4 * ones - repr.len())
        };

        format!("{}{}0{}{}", sign, "1".repeat(ones), prefix, repr)
    }

    fn demodulate(s: &str) -> (Self, &str) {
        let mut ones = 0;
        let iter = s.chars();
        let mut chars_skipped = 0usize;

        for c in iter {
            chars_skipped += 1;
            if c == '0' {
                break;
            }
            ones += 1;
        }

        let res = if ones > 0 {
            let repr = &s[chars_skipped..chars_skipped + ones * 4];
            i64::from_str_radix(repr, 2).expect(&format!("Could not parse number from {}", repr))
        } else {
            0
        };

        chars_skipped += ones * 4;

        (res, &s[chars_skipped..])
    }
}

impl Modulated for Item {
    fn modulate(&self) -> String {
        match self {
            &Item::Number(num) => num.modulate(),
            &Item::Nil() => "00".to_string(),
            &Item::Pair(ref b) => format!("11{}{}", b.0.modulate(), b.1.modulate()),
        }
    }

    fn demodulate(s: &str) -> (Self, &str) {
        let (tag, rest) = s.split_at(2);
        match tag {
            "00" => (Item::Nil(), rest),
            "01" => {
                let (a, b) = i64::demodulate(rest);
                (Item::Number(a), b)
            }
            "10" => {
                let (a, b) = i64::demodulate(rest);
                (Item::Number(-a), b)
            }
            "11" => {
                let (first, rest) = Self::demodulate(rest);
                let (second, rest) = Self::demodulate(rest);
                (Item::pair(first, second), rest)
            }
            _ => unreachable!("match tag somewhy wrong"),
        }
    }
}

#[test]
fn modulate_zero() {
    assert_eq!(0i64.modulate(), "010");
    assert_eq!(i64::demodulate("0").0, 0);
}

#[test]
fn modulate_one() {
    assert_eq!(1i64.modulate(), "01100001");
    assert_eq!(i64::demodulate("100001").0, 1);
}

#[test]
fn modulate_seventeen() {
    assert_eq!(17i64.modulate(), "0111000010001");
    assert_eq!(i64::demodulate("11000010001").0, 17);
}

#[test]
fn modulate_minus_one() {
    assert_eq!((-1i64).modulate(), "10100001");
}

#[test]
fn modulate_minus_seventeen() {
    assert_eq!((-17i64).modulate(), "1011000010001");
}

#[test]
fn modulate_list_with_num() {
    let v: Item = Item::pair(Item::Number(0), Item::Nil());
    assert_eq!(v.modulate(), "1101000");
    assert_eq!(Item::demodulate("1101000").0, v);
}

#[test]
fn modulate_list_with_nils() {
    let v = Item::pair(Item::Nil(), Item::Nil());
    assert_eq!(v.modulate(), "110000");
    assert_eq!(Item::demodulate("110000").0, v);
}

#[test]
fn modulate_list_of_three_elems() {
    // ap mod ap ap cons 1 ap ap cons 2 nil
    let v = Item::pair(Item::Number(1), Item::pair(Item::Number(2), Item::Nil()));
    assert_eq!(v.modulate(), "1101100001110110001000");
    assert_eq!(Item::demodulate("1101100001110110001000").0, v);
}

#[test]
fn modulate_list_of_lists() {
    // ap mod ( 1 , ( 2 , 3 ) , 4 )   =   [( 1 , ( 2 , 3 ) , 4 )]
    let v = Item::pair(
        Item::Number(1),
        Item::pair(
            Item::pair(Item::Number(2), Item::pair(Item::Number(3), Item::Nil())),
            Item::pair(Item::Number(4), Item::Nil()),
        ),
    );

    assert_eq!(
        v.modulate(),
        "1101100001111101100010110110001100110110010000"
    );
    assert_eq!(
        Item::demodulate("1101100001111101100010110110001100110110010000").0,
        v
    );
}
