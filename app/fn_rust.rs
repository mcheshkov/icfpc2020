

fn inc(x: i64) -> i64 {
    x + 1
}

fn dec(x: i64) -> i64 {
    x - 1
}

fn message5() {
    assert_eq!(inc(0), 1);
    assert_eq!(inc(1), 2);
    assert_eq!(inc(2), 3);
    assert_eq!(inc(3), 4);

    assert_eq!(inc(300), 301);
    assert_eq!(inc(301), 302);

    assert_eq!(inc(-1), 0);
    assert_eq!(inc(-2), -1);
    assert_eq!(inc(-3), -2);
}


fn message6() {
    // ap dec 1   =   0
    assert_eq!(dec(1), 0);
    // ap dec 2   =   1
    assert_eq!(dec(2), 1);
    // ap dec 3   =   2
    assert_eq!(dec(3), 2);
    // ap dec 4   =   3
    assert_eq!(dec(4), 3);
    // ap dec 1024   =   1023
    assert_eq!(dec(1024), 1023);

    // ap dec 0   =   -1
    assert_eq!(dec(0), -1);
    // ap dec -1   =   -2
    assert_eq!(dec(-1), -2);
    // ap dec -2   =   -3
    assert_eq!(dec(-2), -3);
}

pub fn main() {
    println!("Fn test");
    message5();
    message6();
}