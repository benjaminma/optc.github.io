(function() {

var sliders = [ ];
var hpSlider = null;
var currentMaxHP = 1;

/* * * * * Functions * * * * */

var parseUnit = function(element,n) {
    return {
        'name'    : element[0]  , 'type'     : element[1]  ,
        'class'   : element[2]  , 'stars'    : element[3]  ,
        'cost'    : element[4]  , 'maxLevel' : element[5]  ,
        'minHP'   : element[6]  , 'minATK'   : element[7]  ,
        'minRCV'  : element[8]  , 'maxHP'    : element[9]  ,
        'maxATK'  : element[10] , 'maxRCV'   : element[11] ,
        'number' : n
    };
};

var getThumbnailUrl = function(n) {
    var id = ('0000' + (n+1)).slice(-4).replace(/(057[54])/,'0$1'); // missing aokiji image
    return 'http://onepiece-treasurecruise.com/wp-content/uploads/f' + id + '.png';
};

var formatNumber = function(n) {
    var rev = function(x) { return x.split('').reverse().join(''); };
    return rev(rev(n).replace(/(\d{3,3})/g,'$1,')).replace(/^,|,$/g,'');
};

var updateSlot = function(slotNumber,unitNumber) {
    var slot = $('.unit')[slotNumber];
    var unit = units[unitNumber];
    // change portrait
    slot.classList.remove('empty');
    $(slot).find('.unitPortrait')[0].style.backgroundImage = 'url(' + getThumbnailUrl(unitNumber) + ')';
    // update slider
    var index = $(slot).index();
    sliders[index].setRange(1,units[unitNumber].maxLevel);
    // reset level
    changeLevelLabel(index,1);
};

var changeCurrentHP = function(currentHP,skipTrigger,skipSlider) {
    currentHP = Math.floor(currentHP);
    var percHP = Math.round(currentHP / currentMaxHP * 10000) / 100;
    $('#hpLabel').text(currentHP + ' HP (' + percHP + '%)');
    if (!skipSlider) hpSlider.val(currentHP);
    if (!skipTrigger) {
        var percHP = Math.floor(currentHP / currentMaxHP * 10000) / 100;
        $(document).trigger('hpChanged',[ currentHP, currentMaxHP, percHP , true ]);
    }
};

var changeMaxHP = function(newValue,skipTrigger) {
    var currentPerc = hpSlider.val() / currentMaxHP;
    currentMaxHP = newValue;
    $('#hpSlider').noUiSlider({
        range: { min: [ 1 ], max: [ newValue ] }
    },true);
    var currentHP = Math.floor(currentPerc * newValue);
    changeCurrentHP(currentHP,skipTrigger,false);
}

var changeUnitLevel = function(slotNumber,level) {
    $('.unit').eq(slotNumber).removeClass('slide');
    $(document).trigger('unitLevelChanged',[ slotNumber, level ]);
};

var changeLevelLabel = function(slotNumber,level) {
    var slot = $($('.unit')[slotNumber]);
    slot.find('.unitLevel').text('Lv.' + level);
};

var getUnitNumberFromSlot = function(slotNumber) {
    var image  = $('.unit').eq(slotNumber).find('.unitPortrait')[0].style.backgroundImage;
    if (image == null) return -1;
    return parseInt(image.match(/f(\d+)/)[1],10);
};

/* * * * * Event callbacks * * * * */

var onUnitLevelClick = function(e) {
    if (e.which == 1 && !this.parentNode.classList.contains('empty'))
        $(this).parent().addClass('slide');
    else if (e.which == 2) {
        // doesn't work on Firefox because FF is a crappy piece of shit
        var slotNumber = $(this).parent().index();
        var unitNumber = getUnitNumberFromSlot(slotNumber);
        changeUnitLevel(slotNumber,units[unitNumber-1].maxLevel);
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
};

var onUnitLevelSlideEnd = function(ui,value) {
    setTimeout(function() {
        changeUnitLevel($(ui).parent().index(),value);
    },100);
};

var onChangeHP = function(event,value) {
    changeCurrentHP(value,false,true);
};

var onSlideHP = function(event,value) {
    changeCurrentHP(value,true,true);
};

var onMerryButtonClick = function() {
    if (this.classList.contains('selected')) return;
    var bonus = parseFloat(this.textContent,10);
    if (isNaN(bonus)) bonus = 1;
    $(document).trigger('merryBonusUpdated',bonus);
};

var onResetButtonClick = function() {
    BootstrapDialog.show({
        title: 'Reset',
        message: 'Are you sure? It won\'t be pretty.',
        buttons: [
            {
                label: 'Yep',
                action: function(dialog) {
                    $(document).trigger('resetStorage');
                    dialog.close();
                }
            }, {
                label: 'Nope',
                cssClass: 'btn-primary',
                action: function(dialog) { dialog.close(); }
            }
        ]
    });
};

/* * * * * Custom event callbacks * * * * */

var onUnitPicked = function(event,slotNumber,unitNumber) {
    updateSlot(slotNumber,unitNumber);
};

var onUnitLevelChanged = function(event,slotNumber,level) {
    changeLevelLabel(slotNumber,level);
}

var onNumbersCrunched = function(event,numbers) {
    // set damage
    Object.keys(numbers).forEach(function(type) {
        if (type == 'HP') return;
        var damage = ''+Math.floor(numbers[type]);
        damage = formatNumber(damage);
        $('.damageAmount#' + type.toLowerCase()).text(damage);
    });
    // set hp
    if (numbers.HP != currentMaxHP)
        changeMaxHP(numbers.HP,false);
};

var onMerryBonusUpdated = function(event,merry) {
    $('#merry > button.selected')[0].classList.remove('selected');
    $('#merry > button')[merry == 1.0 ? 0 : merry == 1.2 ? 1 : 2].classList.add('selected');
};

var onHpChanged = function(event,current,max,perc,skip) {
    if (skip) return;
    if (max != currentMaxHP)
        changeMaxHP(max,true);
    changeCurrentHP(current,true);
};

var onUnitsSwitched = function(event,a,b) {
    var units = $('.unit');
    slotA = units.eq(a);
    slotB = units.eq(b);
    // switch level labels
    var labelA = slotA.find('.unitLevel'), labelB = slotB.find('.unitLevel'), textA = labelA.text();
    labelA.text(labelB.text());
    labelB.text(textA);
    // switch level sliders
    var sliderA = slotA.find('.unitSlider'), sliderB = slotB.find('.unitSlider');
    slotA.append(sliderB);
    slotB.append(sliderA);
    // switch sliders
    sliderA = sliders[a];
    sliders[a] = sliders[b];
    sliders[b] = sliderA;
};

/* * * * * Body * * * * */

$(function() {

    // bootstrap
    
    units = units.map(parseUnit);

    // attach ui events

    $('.unitLevel').click(onUnitLevelClick);

    // attach custom events

    $(document).on('unitPicked',onUnitPicked);
    $(document).on('unitLevelChanged',onUnitLevelChanged);
    $(document).on('numbersCrunched',onNumbersCrunched);
    $(document).on('merryBonusUpdated',onMerryBonusUpdated);
    $(document).on('hpChanged',onHpChanged);
    $(document).on('unitsSwitched',onUnitsSwitched);

    // set up ui elements
    
    $('.unitSlider').each(function(n,x) {
        sliders.push($(x).CircularSlider({
            radius: 44,
            onSlideEnd: onUnitLevelSlideEnd
        }));
    });

    hpSlider = $('#hpSlider').noUiSlider({
        start: [ 0 ],
        range: { min: [ 1 ], max: [ 1 ] },
        connect: 'lower'
    });

    hpSlider.on({
        change: onChangeHP,
        slide: onSlideHP
    });

    $('#merry > button').click(onMerryButtonClick);
    $('#reset').click(onResetButtonClick);

});

})();