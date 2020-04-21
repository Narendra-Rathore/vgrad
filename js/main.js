var vgrad = vgrad || {};

vgrad.SelectedGrads = ko.observableArray([]);
vgrad.indexGradData = function () {
    if (vgrad.GradData != null) {
        vgrad.GradDataIndexed = {};

        var tabPos = 20;

        for (var i = 0; i < vgrad.GradData.length; i++) {
            var grad = vgrad.GradData[i];
            if (i > 0) {
                grad.prevGrad = vgrad.GradData[i - 1];
            } else {
                grad.prevGrad = null;
            }
            if (i < vgrad.GradData.length - 1) {
                grad.nextGrad = vgrad.GradData[i + 1];
            } else {
                grad.nextGrad = null;
            }

            grad.fullname = grad.firstname + " " + grad.lastname;
            grad.thumbnaillabel = "Thumbnail image of graduate " + grad.fullname;
            grad.slidelabel = "Image of graduate " + grad.fullname;
            grad.searchname = grad.fullname.toLowerCase();
            grad.tabPos = tabPos + 1;

            if (grad.photofile && grad.photofile.length > 0) {
                grad.imagesrc = "graduates/" + grad.photofile;
                grad.thumbimagesrc = "thumbnails/" + grad.photofile;
            } else {
                grad.imagesrc = null;
            }
            if (grad.audiofile && grad.audiofile.length > 0) {
                grad.audiosrc = "audio/" + grad.audiofile;
            } else {
                grad.audiosrc = null;
            }
            vgrad.GradDataIndexed[grad.barcode] = grad;
            vgrad.SelectedGrads.push(grad);
        }
    } else {
        console.log("error: trying to index missing GradData")
    } 
};

function insideDetailControls(elem) {
    var isInside = false;

    var checkElem = elem.parentElement;
    while (!isInside && checkElem !== null) {
        if (checkElem.id === "detail-controls") {
            isInside = true;
        } else {
            checkElem = checkElem.parentElement;
        }
    }

    return isInside;
}

vgrad.FocusedGrad = {
    barcode: ko.observable(000000),
    firstname: ko.observable(""),
    lastname: ko.observable(""),
    fullname: ko.observable(""),
    audiosrc: ko.observable(""),
    imagesrc: ko.observable(""),
    slidelabel: ko.observable(""),
    prevGrad: ko.observable(null),
    nextGrad: ko.observable(null)
};

function setFocusedGrad(grad) {
    vgrad.FocusedGrad.barcode(grad.barcode);
    vgrad.FocusedGrad.firstname(grad.firstname);
    vgrad.FocusedGrad.lastname(grad.lastname);
    vgrad.FocusedGrad.fullname(grad.fullname);
    vgrad.FocusedGrad.audiosrc(grad.audiosrc);
    vgrad.FocusedGrad.imagesrc(grad.imagesrc);
    vgrad.FocusedGrad.slidelabel(grad.slidelabel);
    vgrad.FocusedGrad.prevGrad(grad.prevGrad);
    vgrad.FocusedGrad.nextGrad(grad.nextGrad);
}

vgrad.showDetail = function(data) {
    setFocusedGrad(data.grad);
    $('#grad_detail').modal('show');
    // $('#gradgrid').addClass('blurred');
    vgrad.playNameRecording();

    setTimeout(function() {
        $('body').click(function (e) {
            if (!insideDetailControls(e.target)) {
                // $('#grad_detail').modal('hide');
                // $('#gradgrid').removeClass('blurred');
                $('body').off('click');
            }
        });
    }, 500);
    
}

vgrad.showPrevDetail = function (grad) {
    var showGrad = vgrad.GradDataIndexed[grad.prevGrad().barcode];

    setFocusedGrad(showGrad);
    vgrad.playNameRecording();
}

vgrad.showNextDetail = function (grad) {
    var showGrad = vgrad.GradDataIndexed[grad.nextGrad().barcode];

    setFocusedGrad(showGrad);
    vgrad.playNameRecording();
}

vgrad.filterSelected = (function () {
    var previousTerm = "";

    return function (term) {
        // Don't do any work if the user just hit return without changing the search term.
        term = term.toLowerCase();

        if (term !== previousTerm) {
            if (term.length === 0) {
                // Search term is empty, restore all grads
                vgrad.SelectedGrads.removeAll();
                vgrad.GradData.forEach(function (grad) {
                    vgrad.SelectedGrads.push(grad);
                });
            } else if (previousTerm.length === 0 || term.startsWith(previousTerm)) {
                // Search term is a progressive iteration of the previous; simply
                // refine the existing search.
                for (var i = 0; i < vgrad.SelectedGrads().length;) {
                    if (vgrad.SelectedGrads()[i].searchname.indexOf(term) === -1) {
                        vgrad.SelectedGrads.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            } else {
                // Completely new search; start fresh
                vgrad.SelectedGrads.removeAll();
                vgrad.GradData.forEach(function (grad) {
                    if (grad.searchname.indexOf(term) > -1) {
                        vgrad.SelectedGrads.push(grad);
                    }
                });
            }
        }

        previousTerm = term;
        return;
    }
})();

vgrad.emptySearch = ko.computed(function () {
    return vgrad.SelectedGrads().length === 0; 
});

vgrad.playNameRecording = function () {
    var nr = $('#name_recording');
    if (nr.length > 0) {
        nr[0].play();
    }
}

vgrad.VideoSubtitles = ko.observableArray([]);

vgrad.InitVideos = function() {
    vgrad.Settings.Videos.forEach(function (eachVid) {
        vgrad.VideoSubtitles.push({
            id: ko.observable(eachVid.id),
            name: ko.observable(eachVid.name),
            title: ko.observable(eachVid.title),
            arialabel: ko.observable("Video presentation by " + eachVid.name + ", " + eachVid.title)
        });
    });
}

vgrad.MakeMain = function (clickedIndex) {
    var switchOutId = vgrad.VideoSubtitles()[0].id();
    var switchOutName = vgrad.VideoSubtitles()[0].name();
    var switchOutTitle = vgrad.VideoSubtitles()[0].title();

    var toSwitchInPos = parseInt(clickedIndex);
    var toSwitchIn = vgrad.VideoSubtitles()[toSwitchInPos];

    if (toSwitchInPos !== -1) {
        vgrad.VideoSubtitles()[0].id(toSwitchIn.id());
        vgrad.videoPlayers[0].loadVideoById(toSwitchIn.id());
        vgrad.VideoSubtitles()[0].name(toSwitchIn.name());
        vgrad.VideoSubtitles()[0].title(toSwitchIn.title());

        vgrad.VideoSubtitles()[toSwitchInPos].id(switchOutId);
        vgrad.videoPlayers[toSwitchInPos].cueVideoById(switchOutId);
        vgrad.VideoSubtitles()[toSwitchInPos].name(switchOutName);
        vgrad.VideoSubtitles()[toSwitchInPos].title(switchOutTitle);
    }
}

vgrad.VideoKeyPress = function(index, self, event) {
    var keyCode = event.originalEvent.keyCode;

    if (keyCode === 13) {
        event.preventDefault();
        vgrad.MakeMain(index);

        return false;
    }

    return true;
}