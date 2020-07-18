// :1029 = ap ap cons 7 ap ap cons 123229502148636 nil
fn main() -> () {
    use lamcal::*;

    let mut env = Environment::default();

    env.bind(VarName::new("cons"), parse_str("λa.λb.λc.c a b").unwrap());
    env.bind(VarName::new("nil"), parse_str("λx.true").unwrap());
    env.bind(VarName::new("true"), parse_str("λx.λy.x").unwrap());
    env.bind(VarName::new("t1115"), parse_str("cons").unwrap());
    env.bind(VarName::new("t1484"), parse_str("t1115 nil").unwrap());

    let expr = parse_str("t1484 x").unwrap();

    let result = evaluate::<NormalOrder<Enumerate>>(&expr, &env);
    println!("{}", result);
    // println!("{:?}", parse_str("λx.λy.x").unwrap());
}
