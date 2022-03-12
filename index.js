var operatordb = [];
var candidates = [];

$(document).ready(function() {
    $.getJSON("operatordb.json", function(data) {
        console.log(data);
        operatordb = data;
        candidates = operatordb.slice();
    });
    $("form").submit(function(e) {
        if (!allColumnSelected()) {
            alert("必须选择所有选项！");
            return;
        }
        const operator = getOperatorByName($("input#guess").val());
        $("input#guess").val("");
        if (!operator) {
            alert("请输入正确的干员名称");
            return;
        }
        $(".guesses").append('<div class="row"\>' +
            '<div class="column rarity"><div class="emoji active select"></div></div>' +
            '<div class="column team"><div class="emoji active select"></div></div>' +
            '<div class="column className"><div class="emoji active select"></div></div>' +
            '<div class="column race"><div class="emoji active select"></div></div>' +
            '<div class="column painter"><div class="emoji active select"></div></div>' +
            '<div class="column name"><div class="tooltip">' + operator.name + '</div></div>' +
        '</div>');
    });
    $("button#infer").on("click", makeInference);
    $("button#reset").on("click", reset);
    $(".guesses").on("click", ".active", imgShift);
    $(".table").on("click", ".candidate-button", clickCandidate);
});

function imgShift() {
    const column = $(this).parent();
    var stage;
    if ($(this).hasClass("correct")) {
        if (column.hasClass("rarity")) {
            stage = "up";
        } else if (column.hasClass("team") || column.hasClass("className")) {
            stage = "wrongpos";
        } else {
            stage = "wrong";
        }
    } else if ($(this).hasClass("up")) {
        stage = "down";
    } else if ($(this).hasClass("wrongpos")) {
        stage = "wrong";
    } else {
        stage = "correct";
    }
    $(this).removeClass().addClass("emoji active " + stage);
}

function getOperatorByName(name) {
    for (let operator of operatordb) {
        if (operator.name === name) {
            return operator;
        }
    }
}

function allColumnSelected() {
    let result = true;
    $(".active").each(function() {
        if ($(this).hasClass("select")) {
            result = false;
            return false;
        }
    });
    return result;
}

function makeFilter(attr, filterType, operator) {
    if (filterType === "correct") {
        return function(candidate) {
            return candidate[attr].toString() === operator[attr].toString();
        }
    } else if (filterType === "wrong") {
        return function(candidate) {
            if (Array.isArray(candidate[attr])) {
                const intersection = candidate[attr].filter(value => operator[attr].includes(value));
                return intersection.length === 0;
            } else {
                return candidate[attr] !== operator[attr];
            }
        }
    } else if (filterType === "wrongpos") {
        return function(candidate) {
            const intersection = candidate[attr].filter(value => operator[attr].includes(value));
            return candidate[attr].toString() !== operator[attr].toString() && intersection.length > 0;
        }
    } else if (filterType === "up") {
        return function(candidate) {
            return candidate[attr] > operator[attr];
        }
    } else if (filterType === "down") {
        return function(candidate) {
            return candidate[attr] < operator[attr];
        }
    } else {
        return candidate => true;
    }
}

function makeInference() {
    if (!allColumnSelected()) {
        alert("必须选择所有选项！");
        return;
    }
    $(".active").removeClass("active");
    const filters = {rarity: [], team: [], className: [], race: [], painter: []}
    const lastRow = $(".row:last");
    const operator = getOperatorByName(lastRow.find(".tooltip:first").text());
    lastRow.children().each(function() {
        var attr, filterType;
        if ($(this).hasClass("rarity")) {
            attr = "rarity";
        } else if ($(this).hasClass("team")) {
            attr = "team";
        } else if ($(this).hasClass("className")) {
            attr = "className";
        } else if ($(this).hasClass("race")) {
            attr = "race";
        } else if ($(this).hasClass("painter")) {
            attr = "painter";
        }
        const emoji = $(this).children(".emoji:first");
        if (emoji.hasClass("correct")) {
            filterType = "correct";
        } else if (emoji.hasClass("wrong")) {
            filterType = "wrong";
        } else if (emoji.hasClass("wrongpos")) {
            filterType = "wrongpos";
        } else if (emoji.hasClass("up")) {
            filterType = "up";
        } else if (emoji.hasClass("down")) {
            filterType = "down";
        }
        if (attr && filterType && operator) {
            let filter = makeFilter(attr, filterType, operator);
            if (filterType === "correct") {
                filters[attr].length = 0;
            }
            filters[attr].push(filter);
        }
    });
    for (let key of Object.keys(filters)) {
        for (let filter of filters[key]) {
            candidates = candidates.filter(filter);
        }
    }
    renderTable();
}

function renderTable() {
    $('ul.table').html('');
    candidates.forEach(function(operator) {
        $('ul.table').append('<li class=table-column><button class=candidate-button>'
            + operator.name +
        '</button></li>');
    });
}

function clickCandidate() {
    $('input#guess').val($(this).text());
}

function reset() {
    candidates = operatordb;
    $('ul.table').html('');
    $('.row').remove();
    $('input#guess').val('');
}
