!function (factory) {
    "function" == typeof define && define.amd && define.amd.jQuery ? define(["jquery"], factory) : factory("undefined" != typeof module && module.exports ? require("jquery") : jQuery)
}(function ($) {
    "use strict";

    function init(options) {
        return !options || void 0 !== options.allowPageScroll || void 0 === options.swipe && void 0 === options.swipeStatus || (options.allowPageScroll = NONE), void 0 !== options.click && void 0 === options.tap && (options.tap = options.click), options || (options = {}), options = $.extend({}, $.fn.swipe.defaults, options), this.each(function () {
            var $this = $(this), plugin = $this.data(PLUGIN_NS);
            plugin || (plugin = new TouchSwipe(this, options), $this.data(PLUGIN_NS, plugin))
        })
    }

    function TouchSwipe(element, options) {
        function touchStart(jqEvent) {
            if (!(getTouchInProgress() || $(jqEvent.target).closest(options.excludedElements, $element).length > 0)) {
                var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent;
                if (!event.pointerType || "mouse" != event.pointerType || 0 != options.fallbackToMouseEvents) {
                    var ret, touches = event.touches, evt = touches ? touches[0] : event;
                    return phase = PHASE_START, touches ? fingerCount = touches.length : options.preventDefaultEvents !== !1 && jqEvent.preventDefault(), distance = 0, direction = null, currentDirection = null, pinchDirection = null, duration = 0, startTouchesDistance = 0, endTouchesDistance = 0, pinchZoom = 1, pinchDistance = 0, maximumsMap = createMaximumsData(), cancelMultiFingerRelease(), createFingerData(0, evt), !touches || fingerCount === options.fingers || options.fingers === ALL_FINGERS || hasPinches() ? (startTime = getTimeStamp(), 2 == fingerCount && (createFingerData(1, touches[1]), startTouchesDistance = endTouchesDistance = calculateTouchesDistance(fingerData[0].start, fingerData[1].start)), (options.swipeStatus || options.pinchStatus) && (ret = triggerHandler(event, phase))) : ret = !1, ret === !1 ? (phase = PHASE_CANCEL, triggerHandler(event, phase), ret) : (options.hold && (holdTimeout = setTimeout($.proxy(function () {
                        $element.trigger("hold", [event.target]), options.hold && (ret = options.hold.call($element, event, event.target))
                    }, this), options.longTapThreshold)), setTouchInProgress(!0), null)
                }
            }
        }

        function touchMove(jqEvent) {
            var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent;
            if (phase !== PHASE_END && phase !== PHASE_CANCEL && !inMultiFingerRelease()) {
                var ret, touches = event.touches, evt = touches ? touches[0] : event,
                    currentFinger = updateFingerData(evt);
                if (endTime = getTimeStamp(), touches && (fingerCount = touches.length), options.hold && clearTimeout(holdTimeout), phase = PHASE_MOVE, 2 == fingerCount && (0 == startTouchesDistance ? (createFingerData(1, touches[1]), startTouchesDistance = endTouchesDistance = calculateTouchesDistance(fingerData[0].start, fingerData[1].start)) : (updateFingerData(touches[1]), endTouchesDistance = calculateTouchesDistance(fingerData[0].end, fingerData[1].end), pinchDirection = calculatePinchDirection(fingerData[0].end, fingerData[1].end)), pinchZoom = calculatePinchZoom(startTouchesDistance, endTouchesDistance), pinchDistance = Math.abs(startTouchesDistance - endTouchesDistance)), fingerCount === options.fingers || options.fingers === ALL_FINGERS || !touches || hasPinches()) {
                    if (direction = calculateDirection(currentFinger.start, currentFinger.end), currentDirection = calculateDirection(currentFinger.last, currentFinger.end), validateDefaultEvent(jqEvent, currentDirection), distance = calculateDistance(currentFinger.start, currentFinger.end), duration = calculateDuration(), setMaxDistance(direction, distance), ret = triggerHandler(event, phase), !options.triggerOnTouchEnd || options.triggerOnTouchLeave) {
                        var inBounds = !0;
                        if (options.triggerOnTouchLeave) {
                            var bounds = getbounds(this);
                            inBounds = isInBounds(currentFinger.end, bounds)
                        }
                        !options.triggerOnTouchEnd && inBounds ? phase = getNextPhase(PHASE_MOVE) : options.triggerOnTouchLeave && !inBounds && (phase = getNextPhase(PHASE_END)), phase != PHASE_CANCEL && phase != PHASE_END || triggerHandler(event, phase)
                    }
                } else phase = PHASE_CANCEL, triggerHandler(event, phase);
                ret === !1 && (phase = PHASE_CANCEL, triggerHandler(event, phase))
            }
        }

        function touchEnd(jqEvent) {
            var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent, touches = event.touches;
            if (touches) {
                if (touches.length && !inMultiFingerRelease()) return startMultiFingerRelease(event), !0;
                if (touches.length && inMultiFingerRelease()) return !0
            }
            return inMultiFingerRelease() && (fingerCount = fingerCountAtRelease), endTime = getTimeStamp(), duration = calculateDuration(), didSwipeBackToCancel() || !validateSwipeDistance() ? (phase = PHASE_CANCEL, triggerHandler(event, phase)) : options.triggerOnTouchEnd || options.triggerOnTouchEnd === !1 && phase === PHASE_MOVE ? (options.preventDefaultEvents !== !1 && jqEvent.cancelable !== !1 && jqEvent.preventDefault(), phase = PHASE_END, triggerHandler(event, phase)) : !options.triggerOnTouchEnd && hasTap() ? (phase = PHASE_END, triggerHandlerForGesture(event, phase, TAP)) : phase === PHASE_MOVE && (phase = PHASE_CANCEL, triggerHandler(event, phase)), setTouchInProgress(!1), null
        }

        function touchCancel() {
            fingerCount = 0, endTime = 0, startTime = 0, startTouchesDistance = 0, endTouchesDistance = 0, pinchZoom = 1, cancelMultiFingerRelease(), setTouchInProgress(!1)
        }

        function touchLeave(jqEvent) {
            var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent;
            options.triggerOnTouchLeave && (phase = getNextPhase(PHASE_END), triggerHandler(event, phase))
        }

        function removeListeners() {
            $element.unbind(START_EV, touchStart), $element.unbind(CANCEL_EV, touchCancel), $element.unbind(MOVE_EV, touchMove), $element.unbind(END_EV, touchEnd), LEAVE_EV && $element.unbind(LEAVE_EV, touchLeave), setTouchInProgress(!1)
        }

        function getNextPhase(currentPhase) {
            var nextPhase = currentPhase, validTime = validateSwipeTime(), validDistance = validateSwipeDistance(),
                didCancel = didSwipeBackToCancel();
            return !validTime || didCancel ? nextPhase = PHASE_CANCEL : !validDistance || currentPhase != PHASE_MOVE || options.triggerOnTouchEnd && !options.triggerOnTouchLeave ? !validDistance && currentPhase == PHASE_END && options.triggerOnTouchLeave && (nextPhase = PHASE_CANCEL) : nextPhase = PHASE_END, nextPhase
        }

        function triggerHandler(event, phase) {
            var ret, touches = event.touches;
            return (didSwipe() || hasSwipes()) && (ret = triggerHandlerForGesture(event, phase, SWIPE)), (didPinch() || hasPinches()) && ret !== !1 && (ret = triggerHandlerForGesture(event, phase, PINCH)), didDoubleTap() && ret !== !1 ? ret = triggerHandlerForGesture(event, phase, DOUBLE_TAP) : didLongTap() && ret !== !1 ? ret = triggerHandlerForGesture(event, phase, LONG_TAP) : didTap() && ret !== !1 && (ret = triggerHandlerForGesture(event, phase, TAP)), phase === PHASE_CANCEL && touchCancel(event), phase === PHASE_END && (touches ? touches.length || touchCancel(event) : touchCancel(event)), ret
        }

        function triggerHandlerForGesture(event, phase, gesture) {
            var ret;
            if (gesture == SWIPE) {
                if ($element.trigger("swipeStatus", [phase, direction || null, distance || 0, duration || 0, fingerCount, fingerData, currentDirection]), options.swipeStatus && (ret = options.swipeStatus.call($element, event, phase, direction || null, distance || 0, duration || 0, fingerCount, fingerData, currentDirection), ret === !1)) return !1;
                if (phase == PHASE_END && validateSwipe()) {
                    if (clearTimeout(singleTapTimeout), clearTimeout(holdTimeout), $element.trigger("swipe", [direction, distance, duration, fingerCount, fingerData, currentDirection]), options.swipe && (ret = options.swipe.call($element, event, direction, distance, duration, fingerCount, fingerData, currentDirection), ret === !1)) return !1;
                    switch (direction) {
                        case LEFT:
                            $element.trigger("swipeLeft", [direction, distance, duration, fingerCount, fingerData, currentDirection]), options.swipeLeft && (ret = options.swipeLeft.call($element, event, direction, distance, duration, fingerCount, fingerData, currentDirection));
                            break;
                        case RIGHT:
                            $element.trigger("swipeRight", [direction, distance, duration, fingerCount, fingerData, currentDirection]), options.swipeRight && (ret = options.swipeRight.call($element, event, direction, distance, duration, fingerCount, fingerData, currentDirection));
                            break;
                        case UP:
                            $element.trigger("swipeUp", [direction, distance, duration, fingerCount, fingerData, currentDirection]), options.swipeUp && (ret = options.swipeUp.call($element, event, direction, distance, duration, fingerCount, fingerData, currentDirection));
                            break;
                        case DOWN:
                            $element.trigger("swipeDown", [direction, distance, duration, fingerCount, fingerData, currentDirection]), options.swipeDown && (ret = options.swipeDown.call($element, event, direction, distance, duration, fingerCount, fingerData, currentDirection))
                    }
                }
            }
            if (gesture == PINCH) {
                if ($element.trigger("pinchStatus", [phase, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData]), options.pinchStatus && (ret = options.pinchStatus.call($element, event, phase, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData), ret === !1)) return !1;
                if (phase == PHASE_END && validatePinch()) switch (pinchDirection) {
                    case IN:
                        $element.trigger("pinchIn", [pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData]), options.pinchIn && (ret = options.pinchIn.call($element, event, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData));
                        break;
                    case OUT:
                        $element.trigger("pinchOut", [pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData]), options.pinchOut && (ret = options.pinchOut.call($element, event, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom, fingerData))
                }
            }
            return gesture == TAP ? phase !== PHASE_CANCEL && phase !== PHASE_END || (clearTimeout(singleTapTimeout), clearTimeout(holdTimeout), hasDoubleTap() && !inDoubleTap() ? (doubleTapStartTime = getTimeStamp(), singleTapTimeout = setTimeout($.proxy(function () {
                doubleTapStartTime = null, $element.trigger("tap", [event.target]), options.tap && (ret = options.tap.call($element, event, event.target))
            }, this), options.doubleTapThreshold)) : (doubleTapStartTime = null, $element.trigger("tap", [event.target]), options.tap && (ret = options.tap.call($element, event, event.target)))) : gesture == DOUBLE_TAP ? phase !== PHASE_CANCEL && phase !== PHASE_END || (clearTimeout(singleTapTimeout), clearTimeout(holdTimeout), doubleTapStartTime = null, $element.trigger("doubletap", [event.target]), options.doubleTap && (ret = options.doubleTap.call($element, event, event.target))) : gesture == LONG_TAP && (phase !== PHASE_CANCEL && phase !== PHASE_END || (clearTimeout(singleTapTimeout), doubleTapStartTime = null, $element.trigger("longtap", [event.target]), options.longTap && (ret = options.longTap.call($element, event, event.target)))), ret
        }

        function validateSwipeDistance() {
            var valid = !0;
            return null !== options.threshold && (valid = distance >= options.threshold), valid
        }

        function didSwipeBackToCancel() {
            var cancelled = !1;
            return null !== options.cancelThreshold && null !== direction && (cancelled = getMaxDistance(direction) - distance >= options.cancelThreshold), cancelled
        }

        function validatePinchDistance() {
            return null === options.pinchThreshold || pinchDistance >= options.pinchThreshold
        }

        function validateSwipeTime() {
            var result;
            return result = !options.maxTimeThreshold || !(duration >= options.maxTimeThreshold)
        }

        function validateDefaultEvent(jqEvent, direction) {
            if (options.preventDefaultEvents !== !1) if (options.allowPageScroll === NONE) jqEvent.preventDefault(); else {
                var auto = options.allowPageScroll === AUTO;
                switch (direction) {
                    case LEFT:
                        (options.swipeLeft && auto || !auto && options.allowPageScroll != HORIZONTAL) && jqEvent.preventDefault();
                        break;
                    case RIGHT:
                        (options.swipeRight && auto || !auto && options.allowPageScroll != HORIZONTAL) && jqEvent.preventDefault();
                        break;
                    case UP:
                        (options.swipeUp && auto || !auto && options.allowPageScroll != VERTICAL) && jqEvent.preventDefault();
                        break;
                    case DOWN:
                        (options.swipeDown && auto || !auto && options.allowPageScroll != VERTICAL) && jqEvent.preventDefault();
                        break;
                    case NONE:
                }
            }
        }

        function validatePinch() {
            var hasCorrectFingerCount = validateFingers(), hasEndPoint = validateEndPoint(),
                hasCorrectDistance = validatePinchDistance();
            return hasCorrectFingerCount && hasEndPoint && hasCorrectDistance
        }

        function hasPinches() {
            return !!(options.pinchStatus || options.pinchIn || options.pinchOut)
        }

        function didPinch() {
            return !(!validatePinch() || !hasPinches())
        }

        function validateSwipe() {
            var hasValidTime = validateSwipeTime(), hasValidDistance = validateSwipeDistance(),
                hasCorrectFingerCount = validateFingers(), hasEndPoint = validateEndPoint(),
                didCancel = didSwipeBackToCancel(),
                valid = !didCancel && hasEndPoint && hasCorrectFingerCount && hasValidDistance && hasValidTime;
            return valid
        }

        function hasSwipes() {
            return !!(options.swipe || options.swipeStatus || options.swipeLeft || options.swipeRight || options.swipeUp || options.swipeDown)
        }

        function didSwipe() {
            return !(!validateSwipe() || !hasSwipes())
        }

        function validateFingers() {
            return fingerCount === options.fingers || options.fingers === ALL_FINGERS || !SUPPORTS_TOUCH
        }

        function validateEndPoint() {
            return 0 !== fingerData[0].end.x
        }

        function hasTap() {
            return !!options.tap
        }

        function hasDoubleTap() {
            return !!options.doubleTap
        }

        function hasLongTap() {
            return !!options.longTap
        }

        function validateDoubleTap() {
            if (null == doubleTapStartTime) return !1;
            var now = getTimeStamp();
            return hasDoubleTap() && now - doubleTapStartTime <= options.doubleTapThreshold
        }

        function inDoubleTap() {
            return validateDoubleTap()
        }

        function validateTap() {
            return (1 === fingerCount || !SUPPORTS_TOUCH) && (isNaN(distance) || distance < options.threshold)
        }

        function validateLongTap() {
            return duration > options.longTapThreshold && distance < DOUBLE_TAP_THRESHOLD
        }

        function didTap() {
            return !(!validateTap() || !hasTap())
        }

        function didDoubleTap() {
            return !(!validateDoubleTap() || !hasDoubleTap())
        }

        function didLongTap() {
            return !(!validateLongTap() || !hasLongTap())
        }

        function startMultiFingerRelease(event) {
            previousTouchEndTime = getTimeStamp(), fingerCountAtRelease = event.touches.length + 1
        }

        function cancelMultiFingerRelease() {
            previousTouchEndTime = 0, fingerCountAtRelease = 0
        }

        function inMultiFingerRelease() {
            var withinThreshold = !1;
            if (previousTouchEndTime) {
                var diff = getTimeStamp() - previousTouchEndTime;
                diff <= options.fingerReleaseThreshold && (withinThreshold = !0)
            }
            return withinThreshold
        }

        function getTouchInProgress() {
            return !($element.data(PLUGIN_NS + "_intouch") !== !0)
        }

        function setTouchInProgress(val) {
            $element && (val === !0 ? ($element.bind(MOVE_EV, touchMove), $element.bind(END_EV, touchEnd), LEAVE_EV && $element.bind(LEAVE_EV, touchLeave)) : ($element.unbind(MOVE_EV, touchMove, !1), $element.unbind(END_EV, touchEnd, !1), LEAVE_EV && $element.unbind(LEAVE_EV, touchLeave, !1)), $element.data(PLUGIN_NS + "_intouch", val === !0))
        }

        function createFingerData(id, evt) {
            var f = {start: {x: 0, y: 0}, last: {x: 0, y: 0}, end: {x: 0, y: 0}};
            return f.start.x = f.last.x = f.end.x = evt.pageX || evt.clientX, f.start.y = f.last.y = f.end.y = evt.pageY || evt.clientY, fingerData[id] = f, f
        }

        function updateFingerData(evt) {
            var id = void 0 !== evt.identifier ? evt.identifier : 0, f = getFingerData(id);
            return null === f && (f = createFingerData(id, evt)), f.last.x = f.end.x, f.last.y = f.end.y, f.end.x = evt.pageX || evt.clientX, f.end.y = evt.pageY || evt.clientY, f
        }

        function getFingerData(id) {
            return fingerData[id] || null
        }

        function setMaxDistance(direction, distance) {
            direction != NONE && (distance = Math.max(distance, getMaxDistance(direction)), maximumsMap[direction].distance = distance)
        }

        function getMaxDistance(direction) {
            if (maximumsMap[direction]) return maximumsMap[direction].distance
        }

        function createMaximumsData() {
            var maxData = {};
            return maxData[LEFT] = createMaximumVO(LEFT), maxData[RIGHT] = createMaximumVO(RIGHT), maxData[UP] = createMaximumVO(UP), maxData[DOWN] = createMaximumVO(DOWN), maxData
        }

        function createMaximumVO(dir) {
            return {direction: dir, distance: 0}
        }

        function calculateDuration() {
            return endTime - startTime
        }

        function calculateTouchesDistance(startPoint, endPoint) {
            var diffX = Math.abs(startPoint.x - endPoint.x), diffY = Math.abs(startPoint.y - endPoint.y);
            return Math.round(Math.sqrt(diffX * diffX + diffY * diffY))
        }

        function calculatePinchZoom(startDistance, endDistance) {
            var percent = endDistance / startDistance * 1;
            return percent.toFixed(2)
        }

        function calculatePinchDirection() {
            return pinchZoom < 1 ? OUT : IN
        }

        function calculateDistance(startPoint, endPoint) {
            return Math.round(Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)))
        }

        function calculateAngle(startPoint, endPoint) {
            var x = startPoint.x - endPoint.x, y = endPoint.y - startPoint.y, r = Math.atan2(y, x),
                angle = Math.round(180 * r / Math.PI);
            return angle < 0 && (angle = 360 - Math.abs(angle)), angle
        }

        function calculateDirection(startPoint, endPoint) {
            if (comparePoints(startPoint, endPoint)) return NONE;
            var angle = calculateAngle(startPoint, endPoint);
            return angle <= 45 && angle >= 0 ? LEFT : angle <= 360 && angle >= 315 ? LEFT : angle >= 135 && angle <= 225 ? RIGHT : angle > 45 && angle < 135 ? DOWN : UP
        }

        function getTimeStamp() {
            var now = new Date;
            return now.getTime()
        }

        function getbounds(el) {
            el = $(el);
            var offset = el.offset(), bounds = {
                left: offset.left,
                right: offset.left + el.outerWidth(),
                top: offset.top,
                bottom: offset.top + el.outerHeight()
            };
            return bounds
        }

        function isInBounds(point, bounds) {
            return point.x > bounds.left && point.x < bounds.right && point.y > bounds.top && point.y < bounds.bottom
        }

        function comparePoints(pointA, pointB) {
            return pointA.x == pointB.x && pointA.y == pointB.y
        }

        var options = $.extend({}, options),
            useTouchEvents = SUPPORTS_TOUCH || SUPPORTS_POINTER || !options.fallbackToMouseEvents,
            START_EV = useTouchEvents ? SUPPORTS_POINTER ? SUPPORTS_POINTER_IE10 ? "MSPointerDown" : "pointerdown" : "touchstart" : "mousedown",
            MOVE_EV = useTouchEvents ? SUPPORTS_POINTER ? SUPPORTS_POINTER_IE10 ? "MSPointerMove" : "pointermove" : "touchmove" : "mousemove",
            END_EV = useTouchEvents ? SUPPORTS_POINTER ? SUPPORTS_POINTER_IE10 ? "MSPointerUp" : "pointerup" : "touchend" : "mouseup",
            LEAVE_EV = useTouchEvents ? SUPPORTS_POINTER ? "mouseleave" : null : "mouseleave",
            CANCEL_EV = SUPPORTS_POINTER ? SUPPORTS_POINTER_IE10 ? "MSPointerCancel" : "pointercancel" : "touchcancel",
            distance = 0, direction = null, currentDirection = null, duration = 0, startTouchesDistance = 0,
            endTouchesDistance = 0, pinchZoom = 1, pinchDistance = 0, pinchDirection = 0, maximumsMap = null,
            $element = $(element), phase = "start", fingerCount = 0, fingerData = {}, startTime = 0, endTime = 0,
            previousTouchEndTime = 0, fingerCountAtRelease = 0, doubleTapStartTime = 0, singleTapTimeout = null,
            holdTimeout = null;
        try {
            $element.bind(START_EV, touchStart), $element.bind(CANCEL_EV, touchCancel)
        } catch (e) {
            $.error("events not supported " + START_EV + "," + CANCEL_EV + " on jQuery.swipe")
        }
        this.enable = function () {
            return this.disable(), $element.bind(START_EV, touchStart), $element.bind(CANCEL_EV, touchCancel), $element
        }, this.disable = function () {
            return removeListeners(), $element
        }, this.destroy = function () {
            removeListeners(), $element.data(PLUGIN_NS, null), $element = null
        }, this.option = function (property, value) {
            if ("object" == typeof property) options = $.extend(options, property); else if (void 0 !== options[property]) {
                if (void 0 === value) return options[property];
                options[property] = value
            } else {
                if (!property) return options;
                $.error("Option " + property + " does not exist on jQuery.swipe.options")
            }
            return null
        }
    }

    var VERSION = "1.6.18", LEFT = "left", RIGHT = "right", UP = "up", DOWN = "down", IN = "in", OUT = "out",
        NONE = "none", AUTO = "auto", SWIPE = "swipe", PINCH = "pinch", TAP = "tap", DOUBLE_TAP = "doubletap",
        LONG_TAP = "longtap", HORIZONTAL = "horizontal", VERTICAL = "vertical", ALL_FINGERS = "all",
        DOUBLE_TAP_THRESHOLD = 10, PHASE_START = "start", PHASE_MOVE = "move", PHASE_END = "end",
        PHASE_CANCEL = "cancel", SUPPORTS_TOUCH = "ontouchstart" in window,
        SUPPORTS_POINTER_IE10 = window.navigator.msPointerEnabled && !window.navigator.pointerEnabled && !SUPPORTS_TOUCH,
        SUPPORTS_POINTER = (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) && !SUPPORTS_TOUCH,
        PLUGIN_NS = "TouchSwipe", defaults = {
            fingers: 1,
            threshold: 75,
            cancelThreshold: null,
            pinchThreshold: 20,
            maxTimeThreshold: null,
            fingerReleaseThreshold: 250,
            longTapThreshold: 500,
            doubleTapThreshold: 200,
            swipe: null,
            swipeLeft: null,
            swipeRight: null,
            swipeUp: null,
            swipeDown: null,
            swipeStatus: null,
            pinchIn: null,
            pinchOut: null,
            pinchStatus: null,
            click: null,
            tap: null,
            doubleTap: null,
            longTap: null,
            hold: null,
            triggerOnTouchEnd: !0,
            triggerOnTouchLeave: !1,
            allowPageScroll: "auto",
            fallbackToMouseEvents: !0,
            excludedElements: ".noSwipe",
            preventDefaultEvents: !0
        };
    $.fn.swipe = function (method) {
        var $this = $(this), plugin = $this.data(PLUGIN_NS);
        if (plugin && "string" == typeof method) {
            if (plugin[method]) return plugin[method].apply(plugin, Array.prototype.slice.call(arguments, 1));
            $.error("Method " + method + " does not exist on jQuery.swipe")
        } else if (plugin && "object" == typeof method) plugin.option.apply(plugin, arguments); else if (!(plugin || "object" != typeof method && method)) return init.apply(this, arguments);
        return $this
    }, $.fn.swipe.version = VERSION, $.fn.swipe.defaults = defaults, $.fn.swipe.phases = {
        PHASE_START: PHASE_START,
        PHASE_MOVE: PHASE_MOVE,
        PHASE_END: PHASE_END,
        PHASE_CANCEL: PHASE_CANCEL
    }, $.fn.swipe.directions = {
        LEFT: LEFT,
        RIGHT: RIGHT,
        UP: UP,
        DOWN: DOWN,
        IN: IN,
        OUT: OUT
    }, $.fn.swipe.pageScroll = {
        NONE: NONE,
        HORIZONTAL: HORIZONTAL,
        VERTICAL: VERTICAL,
        AUTO: AUTO
    }, $.fn.swipe.fingers = {ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, ALL: ALL_FINGERS}
});

!function (t) {
    function i(i) {
        i.each(function () {
            var i = t(this), a = i.data("animation");
            i.addClass(a).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function () {
                i.removeClass(a)
            })
        })
    }

    t(".carousel").each(function () {
        var i, a = t(this), e = a[0].hasAttribute("data-column");
        if (!0 === e) {
            function s() {
                var i = a.attr("id"), s = a.find(".carousel-item"), r = t(s).length, n = a.attr("data-column"),
                    o = a.attr("data-m1200"), l = a[0].hasAttribute("data-m1200"), c = a.attr("data-m992"),
                    u = a[0].hasAttribute("data-m992"), d = a.attr("data-m768"), h = a[0].hasAttribute("data-m768"),
                    m = a.attr("data-m576"), f = a[0].hasAttribute("data-m576");

                function _(e, o, l, c) {
                    if (t("#" + i).css({display: "block"}), !0 === e) var u = o; else u = n;
                    if ("" !== u && u > 0 && u <= r) {
                        if (window.matchMedia(l).matches) {
                            t(s).each(function () {
                                var i = t(this);
                                i.find(".cloneditems").remove();
                                for (var a = 1; a < u; a++) (i = i.next()).length || (i = t(this).siblings(":first")), i.children(":first-child").children(":first-child").clone().addClass("cloneditem-" + a + " cloneditems").appendTo(t(this).children(":first-child"))
                            });
                            var d = 100 / u + "%";
                            t(s).on("slideIsChanging", function () {
                                a.find(".active.carousel-item-left, .carousel-item-prev").css({
                                    "-webkit-transform": "translateX(-" + d + ")",
                                    transform: "translateX(-" + d + ")",
                                    "-webkit-transform": "-webkit-translate3d(-" + d + ",0,0)",
                                    transform: "translate3d(-" + d + ",0,0)"
                                }), a.find(".carousel-item-next, .active.carousel-item-right").css({
                                    "-webkit-transform": "translateX(" + d + ")",
                                    transform: "translateX(" + d + ")",
                                    "-webkit-transform": "-webkit-translate3d(" + d + ",0,0)",
                                    transform: "translate3d(" + d + ",0,0)"
                                }), a.find(".carousel-item-next.carousel-item-left, .carousel-item-prev.carousel-item-right").css({
                                    "-webkit-transform": "translateX(0)",
                                    transform: "translateX(0)",
                                    "-webkit-transform": "-webkit-translate3d(0,0,0)",
                                    transform: "translate3d(0,0,0)"
                                })
                            })
                        }
                    } else {
                        var h = "In Slider Id : #" + i;
                        h += "\n", h += "You are assigning the value (" + u + ") to the (data-" + c + ") attribute. Which is greater than numbers of carousel-item those you are creating (" + r + ")", h += "\n\n", h += "Please make sure the value of (data-" + c + ") should be <= to numbers of carousel-item (" + r + ").", h += "\n\n", h += "Note : The values should not be 0 or empty And also (Positive Integers only)", alert(h), t("#" + i).css({display: "none"})
                    }
                }

                _(e, n, "(min-width: 1201px)", "column"), _(l, o, "(min-width: 993px) and (max-width: 1200px)", "m1200"), _(u, c, "(min-width: 769px) and (max-width: 992px)", "m992"), _(h, d, "(min-width: 577px) and (max-width: 768px)", "m768"), _(f, m, "(max-width: 576px)", "m576")
            }

            i = jQuery.fn.addClass, jQuery.fn.addClass = function () {
                var t = i.apply(this, arguments);
                return jQuery(this).trigger("slideIsChanging"), t
            }, s(), t(window).resize(function () {
                clearTimeout(a.id), a.id = setTimeout(s, 100)
            })
        }
    });
    var a = t(".carousel"), e = a.find(".carousel-item:first").find("[data-animation ^= 'animated']");
    a.carousel(), i(e), a.on("slide.bs.carousel", function (a) {
        i(t(a.relatedTarget).find("[data-animation ^= 'animated']"))
    });
    for (var s = t(".carousel"), r = s.length, n = 0; n < r; n++) {
        t.fn.carousel.Constructor.TRANSITION_DURATION = 9999999;
        var o = s.eq(n).data("duration"), l = t("[data-duration=" + o + "] > .carousel-inner > .carousel-item");
        t(l).each(function () {
            t(this).css({
                "-webkit-transition-duration": o + "ms",
                "-moz-transition-duration": o + "ms",
                "transition-duration": o + "ms"
            })
        })
    }
    var c = t(".carousel").find("[class=mouse_wheel_y]");
    t(".carousel").find("[class=mouse_wheel_xy]") && t(".mouse_wheel_xy").bind("mousewheel", function (i) {
        i.originalEvent.wheelDelta / 120 > 0 ? t(this).carousel("prev") : t(this).carousel("next")
    }), c && t(".mouse_wheel_y").bind("mousewheel", function (i) {
        i.originalEvent.wheelDelta / 120 > 0 && t(this).carousel("next")
    });
    var u = t(".carousel").find("[class=swipe_y]"), d = t(".carousel").find("[class=swipe_x]");
    u && t(".swipe_y .carousel-inner").swipe({
        swipeUp: function (i, a, e, s, r) {
            t(this).parent().carousel("next")
        }, swipeDown: function () {
            t(this).parent().carousel("prev")
        }, threshold: 0
    }), d && t(".swipe_x .carousel-inner").swipe({
        swipeLeft: function (i, a, e, s, r) {
            t(this).parent().carousel("next")
        }, swipeRight: function () {
            t(this).parent().carousel("prev")
        }, threshold: 0
    });
    var h = 0, m = 0, f = t(".carousel").find("[class=thumb_scroll_y]"),
        _ = t(".carousel").find("[class=thumb_scroll_x]");
    f && t(".thumb_scroll_y").on("slid.bs.carousel", function () {
        var i = -1 * t(".thumb_scroll_y .carousel-indicators li:first").position().top + t(".thumb_scroll_y .carousel-indicators li:last").position().top + t(".thumb_scroll_y .carousel-indicators li:last").height(),
            a = t(".thumb_scroll_y .carousel-indicators li.active").position().top + t(".thumb_scroll_y .carousel-indicators li.active").height() / 1 + h - t(".thumb_scroll_y .carousel-indicators").height() / 1;
        a < 0 && (a = 0), a > i - t(".thumb_scroll_y .carousel-indicators").height() && (a = i - t(".thumb_scroll_y .carousel-indicators").height()), t(".thumb_scroll_y .carousel-indicators").animate({scrollTop: a}, 800), h = a
    }), _ && t(".thumb_scroll_x").on("slid.bs.carousel", function () {
        var i = -1 * t(".thumb_scroll_x .carousel-indicators li:first").position().left + t(".thumb_scroll_x .carousel-indicators li:last").position().left + t(".thumb_scroll_x .carousel-indicators li:last").width(),
            a = t(".thumb_scroll_x .carousel-indicators li.active").position().left + t(".thumb_scroll_x .carousel-indicators li.active").width() / 1 + m - t(".thumb_scroll_x .carousel-indicators").width() / 1;
        a < 0 && (a = 0), a > i - t(".thumb_scroll_x .carousel-indicators").width() && (a = i - t(".thumb_scroll_x .carousel-indicators").width()), t(".thumb_scroll_x .carousel-indicators").animate({scrollLeft: a}, 800), m = a
    }), t(".pauseVideo").on("slide.bs.carousel", function () {
        t("video").each(function () {
            this.pause()
        })
    }), t(".onlinePauseVideo").on("slide.bs.carousel", function (i) {
        t(i.target).find("iframe").each(function (i, a) {
            t(a).attr("src", t(a).attr("src"))
        })
    });
    var b = t(".carousel.ps_full_screen > .carousel-inner > .carousel-item"), w = t(window).height();
    b.eq(0).addClass("active"), b.height(w), b.addClass("ps_full_s"), t(".carousel.ps_full_screen > .carousel-inner > .carousel-item > img").each(function () {
        var i = t(this).attr("src");
        t(this).parent().css({"background-image": "url(" + i + ")"}), t(this).remove()
    }), t(window).on("resize", function () {
        w = t(window).height(), b.height(w)
    })
}(jQuery);
