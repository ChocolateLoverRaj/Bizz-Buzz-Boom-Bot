//Math stuff
const factor = {};

//Check if a number is a factor of another
factor.isOf = (num1, num2) => num2 / num1 == Math.round(num2 / num1);

//Check if the person said it right or not
factor.checkMessage = (message, num) => {
    var reString = "";
    var sayings = [2, 3, 5];
    var sounds = {
        2: "bizz",
        3: "buzz",
        5: "boom"
    }
    var sayTheNumber = true
    sayings.forEach(saying => {
        if (factor.isOf(saying, num)) {
            reString += "(?=(.*" + sounds[saying] + "))";
            sayTheNumber = false
        }
        else {
            reString += "(?!(.*" + sounds[saying] + "))";
        }
    });
    if (sayTheNumber) {
        return message == num.toString();
    }
    else {
        var re = new RegExp(reString, "i");
        return re.test(message);
    }
};

//Export the module
module.exports = factor;