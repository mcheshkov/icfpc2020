import assert from "assert";

export type Data = bigint | [Data, Data] | null;

const BITS_PER_ONE: number = 4;

function modulateNumber(n: bigint): string {
    let sign = n < 0 ? "10" : "01";

    let repr = n === 0n ? "" : (n < 0 ? -1n*n : n).toString(2);

    let ones = n === 0n ? 0 : Math.ceil(repr.length / BITS_PER_ONE); // div и округление вверх
    const onesStr = new Array(ones).fill("1").join("");

    // нули, которых не хватает в repr
    let prefix = n === 0n ? "" : new Array(4 * ones - repr.length).fill("0").join("");

    return `${sign}${onesStr}0${prefix}${repr}`;
}

export function modulate(data: Data): string {
    if (typeof data === "bigint") {
        return modulateNumber(data);
    } else if (data === null) {
        return '00';
    } else {
        return `11${modulate(data[0])}${modulate(data[1])}`;
    }
}

function demodulateNumber(s: string): [bigint, string] {
    let ones = 0;
    let chars_skipped = 0;

    for (const c of s) {
        chars_skipped += 1;
        if (c === '0') {
            break;
        }
        ones += 1;
    }

    let res = 0n;
    if (ones > 0) {
        let repr = s.substring(chars_skipped, chars_skipped + ones * 4);
        res = BigInt(`0b${repr}`);
    }

    chars_skipped += ones * 4;

    return [res, s.substring(chars_skipped)];
}

export function demodulate(s: string): [Data, string] {
    let tag = s.substr(0, 2);
    let rest = s.substr(2);

    switch (tag) {
        case "00":
            return [null, rest];
        case "01": {
            let [a, b] = demodulateNumber(rest);
            return [a, b];
        }
        case "10":
            let [a, b] = demodulateNumber(rest);
            return [-1n*a, b];
        case "11": {
            let [first, rest1] = demodulate(rest);
            let [second, rest2] = demodulate(rest1);
            return [[first, second], rest2];
        }
        default:
            throw new Error(`Invalid tag: ${s}`);
    }
}

function test_modulate_zero() {
    assert.deepStrictEqual(modulateNumber(0n), "010");
    assert.deepStrictEqual(demodulateNumber("0")[0], 0n);
}

function test_modulate_one() {
    assert.deepStrictEqual(modulateNumber(1n), "01100001");
    assert.deepStrictEqual(demodulateNumber("100001")[0], 1n);
}

function test_modulate_seventeen() {
    assert.deepStrictEqual(modulateNumber(17n), "0111000010001");
    assert.deepStrictEqual(demodulateNumber("11000010001")[0], 17n);
}

function test_modulate_minus_one() {
    assert.deepStrictEqual(modulateNumber(-1n), "10100001");
}

function test_modulate_minus_seventeen() {
    assert.deepStrictEqual(modulateNumber(-17n), "1011000010001");
}

function test_modulate_list_with_num() {
    let v: Data = [0n, null];
    assert.deepStrictEqual(modulate(v), "1101000");
    assert.deepStrictEqual(demodulate("1101000")[0], v);
}

function test_modulate_list_with_nils() {
    let v: Data = [null, null];
    assert.deepStrictEqual(modulate(v), "110000");
    assert.deepStrictEqual(demodulate("110000")[0], v);
}

function test_modulate_list_of_three_elems() {
    // ap mod ap ap cons 1 ap ap cons 2 nil
    let v: Data = [1n, [2n, null]];
    assert.deepStrictEqual(modulate(v), "1101100001110110001000");
    assert.deepStrictEqual(demodulate("1101100001110110001000")[0], v);
}

function test_modulate_list_of_lists() {
    // ap mod ( 1 , ( 2 , 3 ) , 4 )   =   [( 1 , ( 2 , 3 ) , 4 )]
    let v: Data = [
        1n,
        [
            [2n, [3n, null]],
            [4n, null]
        ]
    ];

    assert.deepStrictEqual(
        modulate(v),
        "1101100001111101100010110110001100110110010000"
    );
    assert.deepStrictEqual(
        demodulate("1101100001111101100010110110001100110110010000")[0],
        v
    );
}

function test() {
    test_modulate_zero();
    test_modulate_one();
    test_modulate_seventeen();
    test_modulate_minus_one();
    test_modulate_minus_seventeen();
    test_modulate_list_with_num();
    test_modulate_list_with_nils();
    test_modulate_list_of_three_elems();
    test_modulate_list_of_lists();
}

test();