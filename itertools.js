function permutator(inputArr, r) {
    const n = inputArr.length;
    if (n === 0) {
        return []
    }
    if (r === 1) {
        return inputArr.map(a => [a])
    }
    let car = inputArr[0];
    let cdr = inputArr.slice(1);

    return [
        ...permutator(cdr, r - 1).map(selection => [car, ...selection]),
        ...permutator(cdr, r)
    ];
}

function groupBy(xs, f) {
    return xs.reduce(function (acc, x) {
        const result = f(x);
        (acc[result] = acc[result] || []).push(x);
        return acc;
    }, {});
}

function argmax(a) {
    return a.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
}

function most_common_value(array) {
    const count = {};
    array.forEach(function (a) {
        count[a] = (count[a] || 0) + 1;
    });
    const i = argmax(Object.values(count));
    return Object.keys(count)[i];
}