function ten() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("ten");
            resolve(10);
        }, 1000);
    });
};

var t = ten();

t.then(n => {
    console.log(n, t, t + 1)
})

setTimeout(() => {
    t.then(n => {
        console.log("race", n)
    })
}, 500);