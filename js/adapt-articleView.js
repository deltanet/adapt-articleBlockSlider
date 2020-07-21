define([
    'core/js/adapt',
    'core/js/views/articleView'
], function(Adapt, AdaptArticleView) {

    function debounce(callback, timeout) {

        var handle = null;
        var debounced = function debounced() {
            clearTimeout(handle);
            handle = setTimeout(callback, timeout);
        };
        debounced.cancel = function cancelDebounce() {
            clearTimeout(handle);
        };
        return debounced;
    }

    var BlockSliderView = {
        _disableAnimationOnce: false,

        events: {
            "click [data-block-slider]": "_onBlockSliderClick"
        },

        preRender: function() {
            AdaptArticleView.prototype.preRender.call(this);

            if (!this.model.isBlockSliderEnabled()) {
                this.$el.addClass('article-block-slider-disabled');
                return;
            }

            this._blockSliderPreRender();
        },

        _blockSliderPreRender: function() {
            this._blockSliderSetupEventListeners();
        },

        _blockSliderSetupEventListeners: function() {

            this._blockSliderResizeHeight = _.bind(this._blockSliderResizeHeight, this);

            this.listenTo(Adapt, {
                "device:resize": this._onBlockSliderResize,
                "device:changed": this._onBlockSliderDeviceChanged,
                "page:scrollTo": this._onBlockSliderPageScrollTo,
                "page:scrolledTo": this._onBlockSliderPageScrolledTo
            });

            this.listenToOnce(Adapt, "remove", this._onBlockSliderRemove);
            this.listenToOnce(this.model, "change:_isReady", this._onBlockSliderReady);

            var duration = this.model.get("_articleBlockSlider")._slideAnimationDuration || 200;

            this._blockSliderHideOthers = debounce(_.bind(this._blockSliderHideOthers, this), duration);
        },

        render: function() {
            if (this.model.isBlockSliderEnabled()) {

                this._blockSliderRender();

            } else AdaptArticleView.prototype.render.call(this);
        },

        _blockSliderRender: function() {
            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            this._blockSliderConfigureVariables();

            var data = this.model.toJSON();
            var template = Handlebars.templates['articleBlockSlider-article'];
            this.$el.html(template(data));

            this.addChildren();

            this.$el.addClass('article-block-slider-enabled');

            var progressLoc = this.model.get('_articleBlockSlider')._progressLocation;

            if(progressLoc == 'top') {
                this.$('.article-block-progressBottom').remove();
                this.$('.article-block-toolbar').addClass('top');
            }

            if(progressLoc == 'bottom') {
                this.$('.article-block-progressTop').remove();
                this.$('.article-block-toolbar').addClass('bottom');
            }

            if(progressLoc == 'none') {
                this.$('.article-block-progressTop').remove();
                this.$('.article-block-progressBottom').remove();
                this.$('.article-block-toolbar').addClass('none');
            }

            if(this.model.get('_articleBlockSlider')._fullWidth) {
                this.$el.addClass('fullwidth');
            }

            this.delegateEvents();

            this.$el.imageready(_.bind(function() {
                _.delay(_.bind(this._blockSliderPostRender, this), 500);
            }, this));

            return this;
        },

        _blockSliderConfigureVariables: function() {
            this.model.set('_marginDir', 'left');
            if (Adapt.config.get('_defaultDirection') == 'rtl') {
                this.model.set('_marginDir', 'right');
            }

            var slideWidth = Math.round(this.$('.block-container').width());
            var stage = this.model.get('_stage');
            var margin = -(stage * slideWidth);

            this.$('.block-container').css(('margin-' + this.model.get('_marginDir')), margin);

            var blocks = this.model.getChildren().models;
            var totalBlocks = blocks.length;

            this.model.set("_currentBlock", 0);
            this.model.set("_totalBlocks", totalBlocks);

            var itemButtons = [];

            for (var i = 0, l = totalBlocks; i < l; i++) {
                itemButtons.push({
                    _className: (i === 0 ? "home" : "not-home") + (" i"+i),
                    _index: i,
                    _includeNumber: i !== 0,
                    _title: blocks[i].get('title')
                });
            }

            this.model.set("_itemButtons", itemButtons);

            this.blockEnabled = [];
            this.blockForward = [];
            this.blockBack = [];

            for (var i = 0, l = totalBlocks; i < l; i++) {
              if (blocks[i].has('_articleBlockSlider')) {
                this.blockEnabled[i] = blocks[i].get('_articleBlockSlider')._isEnabled;
                this.blockForward[i] = blocks[i].get('_articleBlockSlider').forward;
                this.blockBack[i] = blocks[i].get('_articleBlockSlider').back;
              }
            }
        },

        _onBlockComplete: function() {
          var _currentBlock = this.model.get("_currentBlock");
          var _totalBlocks = this.model.get("_totalBlocks");
          var $right = this.$el.find("[data-block-slider='right']");
          var blocks = this.model.getChildren().models;

          if (blocks[_currentBlock].get('_isComplete') == true && (_currentBlock < (_totalBlocks - 1))) {
            $right.a11y_cntrl_enabled(true);
          }
        },

        _blockSliderConfigureControls: function(animate) {
            var duration = this.model.get("_articleBlockSlider")._slideAnimationDuration || 200;

            if (this._disableAnimationOnce) animate = false;

            var _currentBlock = this.model.get("_currentBlock");
            var _totalBlocks = this.model.get("_totalBlocks");

            var $left = this.$el.find("[data-block-slider='left']");
            var $right = this.$el.find("[data-block-slider='right']");

            if (this.model.get("_articleBlockSlider")._hasButtons && this.blockEnabled[_currentBlock]) {
              $left.html(this.blockBack[_currentBlock]);
              $right.html(this.blockForward[_currentBlock]);
            }

            if (_currentBlock === 0) {
                $left.a11y_cntrl_enabled(false);
                $right.a11y_cntrl_enabled(true);
            } else if (_currentBlock == _totalBlocks - 1 ) {
                $left.a11y_cntrl_enabled(true);
                $right.a11y_cntrl_enabled(false);
            } else {
                $left.a11y_cntrl_enabled(true);
                $right.a11y_cntrl_enabled(true);
            }

            if (_currentBlock < (_totalBlocks - 1)) {
              // Reset
              $right.a11y_cntrl_enabled(true);

              var blocks = this.model.getChildren().models;

              if (blocks[_currentBlock].get('_isComplete') == false) {
                $right.a11y_cntrl_enabled(false);
              }
            }

            var $indexes = this.$el.find("[data-block-slider='index']");
            $indexes.a11y_cntrl_enabled(true).removeClass("selected");
            $indexes.eq(_currentBlock).a11y_cntrl_enabled(false).addClass("selected visited");

            // Progress
            var $progress = this.$el.find("[data-block-slider-progress='index']");
            $progress.removeClass("selected");
            $progress.eq(_currentBlock).addClass("selected visited");

            var $blocks = this.$el.find(".block");
            if (!$blocks.length) return;

            $blocks.a11y_on(false).eq(_currentBlock).a11y_on(true);

            _.delay(_.bind(function() {
                this.navClicked = false;
                if ($blocks.eq(_currentBlock).onscreen().onscreen) $blocks.eq(_currentBlock).a11y_focus();
            }, this), duration);
        },

        _blockSliderSetButtonLayout: function() {
            var buttonsLength = this.model.get('_itemButtons').length;
            var itemwidth = 100 / buttonsLength;
            this.$('.item-button').css({
                width: itemwidth + '%'
            });
        },

        _blockSliderPostRender: function() {
            this._blockSliderConfigureControls(false);

            this._onBlockSliderDeviceChanged();

            var startIndex = this.model.get("_articleBlockSlider")._startIndex || 0;

            this._blockSliderMoveIndex(startIndex, false);

            var blocks = this.model.getChildren().models;
            for (var i = 0, l = blocks.length; i < l; i++) {
                this.listenTo(blocks[i], "change:_isComplete", this._onBlockComplete);
            }

            Adapt.trigger(this.constructor.type + 'View:postRender', this);
        },

        _onBlockSliderReady: function() {
            this._blockSliderHideOthers();
            _.delay(_.bind(function(){
                this._blockSliderConfigureControls(false);
                this._onBlockSliderResize();
            },this),250);
            this.$(".component").on("resize", this._blockSliderResizeHeight);
        },

        _onBlockSliderClick: function(event) {
            event.preventDefault();

            if (this.navClicked) return;

            this.navClicked = true;

            var id = $(event.currentTarget).attr("data-block-slider");

            switch(id) {
            case "left":
                this._blockSliderMoveLeft();
                break;
            case "index":
                var index = parseInt($(event.currentTarget).attr("data-block-slider-index"));
                this._blockSliderMoveIndex(index);
                break;
            case "right":
                this._blockSliderMoveRight();
                break;
            }
        },

        _blockSliderMoveLeft: function() {
            if (this.model.get("_currentBlock") === 0) return;

            var index = this.model.get("_currentBlock");
            this._blockSliderMoveIndex(--index);
        },

        _blockSliderMoveIndex: function(index, animate) {
            if (this.model.get("_currentBlock") != index) {
                this.model.set("_currentBlock", index);

                Adapt.trigger('media:stop');//in case any of the blocks contain media that's been left playing by the user

                this._blockSliderSetVisible(this.model.getChildren().models[index], true);
                this._blockSliderResizeHeight(animate);
                this._blockSliderScrollToCurrent(animate);
                this._blockSliderConfigureControls(animate);
            }

            var duration = this.model.get("_articleBlockSlider")._slideAnimationDuration || 200;

            if (this._disableAnimationOnce) animate = false;

            if (animate !== false) {
                _.delay(function() {
                    $(window).resize();
                }, duration);
            } else {
                $(window).resize();
            }
        },

        _blockSliderMoveRight: function() {
            if (this.model.get("_currentBlock") == this.model.get("_totalBlocks") - 1 ) return;

            var index = this.model.get("_currentBlock");
            this._blockSliderMoveIndex(++index);
        },

        _blockSliderScrollToCurrent: function(animate) {
            var isEnabled = this._blockSliderIsEnabledOnScreenSizes();
            var $container = this.$el.find(".article-block-slider");

            if (!isEnabled) {
                return $container.scrollLeft(0);
            }

            var blocks = this.$el.find(".block");
            var blockWidth = Math.round($container.width());

            var totalLeft = this.model.get("_currentBlock") * blockWidth;

            this._blockSliderShowAll();

            var duration = this.model.get("_articleBlockSlider")._slideAnimationDuration || 200;

            var currentBlock = this.model.get("_currentBlock");
            var $currentBlock = $(blocks[currentBlock]);

            if (this._disableAnimationOnce) animate = false;

            var movementSize = Math.round(this.$('.article-block-slider').width());
            var marginDir = {};

            if (animate === false) {
                _.defer(_.bind(function(){
                    marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * currentBlock);
                    this.$('.block-container').css(marginDir);
                    this._blockSliderHideOthers();
                }, this));
            } else {
                marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * currentBlock);
                this.$('.block-container').velocity("stop", true).velocity(marginDir);
                this._blockSliderHideOthers();
            }
        },

        _blockSliderIsEnabledOnScreenSizes: function() {
            var isEnabledOnScreenSizes = this.model.get("_articleBlockSlider")._isEnabledOnScreenSizes;

            var sizes = isEnabledOnScreenSizes.split(" ");
            if (_.indexOf(sizes, Adapt.device.screenSize) > -1) {
                return true;
            }
            return false;
        },

        _blockSliderShowAll: function() {

            this._blockSliderHideOthers.cancel();

            var blocks = this.model.getChildren().models;
            var currentIndex = this.model.get("_currentBlock");

            for (var i = 0, l = blocks.length; i < l; i++) {
                this._blockSliderSetVisible(blocks[i], true);
            }
        },

        _blockSliderHideOthers: function() {
            var blocks = this.model.getChildren().models;
            var currentIndex = this.model.get("_currentBlock");

            for (var i = 0, l = blocks.length; i < l; i++) {
                if (i != currentIndex) {
                    this._blockSliderSetVisible(blocks[i], false);
                } else {
                    this._blockSliderSetVisible(blocks[i], true);
                }
            }
        },

        _blockSliderSetVisible: function(model, value) {
            var id = model.get("_id");

            if(value) {
              this.$el.find("."+id + " *").removeClass('element-hidden');
            } else {
              this.$el.find("."+id + " *").addClass('element-hidden');
            }
        },

        _onBlockSliderResize: function() {
            this._blockSliderResizeWidth(false);
            this._blockSliderResizeHeight(false);
            this._blockSliderScrollToCurrent(false);
            this._blockSliderResizeTab();
            Adapt.trigger('blockslider:resize');
        },

        _blockSliderResizeHeight: function(animate) {
            var $container = this.$el.find(".article-block-slider");
            var isEnabled = this._blockSliderIsEnabledOnScreenSizes();

            var minHeight = this.model.get("_articleBlockSlider")._minHeight;

            if (!isEnabled) {
                this._blockSliderShowAll();
                return $container.velocity("stop").css({"height": "", "min-height": ""});
            }

            var currentBlock = this.model.get("_currentBlock");
            var $blocks = this.$el.find(".block");
            var $blockInners = this.$el.find(".block-inner");

            if (minHeight) {
                $blockInners.css({"min-height": minHeight+"px"});
            }

            var currentHeight = $container.height();
            var blockHeight = $blocks.eq(currentBlock).height();

            var maxHeight = -1;
            $container.find(".block").each(function() {
                if ($(this).height() > maxHeight) {
                    maxHeight = $(this).height();
                }
            });

            var duration = (this.model.get("_articleBlockSlider")._heightAnimationDuration || 200) * 2;

            if (this._disableAnimationOnce) animate = false;

            if (this.model.get("_articleBlockSlider")._hasUniformHeight) {
                if (animate === false) {
                    $container.css({"height": maxHeight+"px"});
                } else {
                    $container.velocity("stop").velocity({"height": maxHeight+"px"}, {duration: duration });//, easing: "ease-in"});
                }
            } else if (currentHeight <= blockHeight) {

                if (animate === false) {
                    $container.css({"height": blockHeight+"px"});
                } else {
                    $container.velocity("stop").velocity({"height": blockHeight+"px"}, {duration: duration });//, easing: "ease-in"});
                }

            } else if (currentHeight > blockHeight) {

                if (animate === false) {
                    $container.css({"height": blockHeight+"px"});
                } else {
                    $container.velocity("stop").velocity({"height": blockHeight+"px"}, {duration: duration });//, easing: "ease-in"});
                }

            }

            if (minHeight) {
                $container.css({"min-height": minHeight+"px"});
            }
        },

        _blockSliderResizeTab: function() {
            if (!this.model.get("_articleBlockSlider")._hasTabs) return;

            this._blockSliderSetButtonLayout();

            this.$('.item-button').css({
                height: ""
            });

            var parentHeight = this.$('.item-button').parent().height();
            this.$('.item-button').css({
                height: parentHeight + 'px'
            });

            var toolbarHeight = this.$('.article-block-toolbar').height();
            var additionalMargin = '30';
            this.$('.article-block-toolbar').css({
                top: '-' + (toolbarHeight + (additionalMargin/2)) + 'px'
            });

            var toolbarMargin = parseFloat(toolbarHeight) + parseFloat(additionalMargin);
            this.$('.article-block-slider').css({
                marginTop: toolbarMargin + 'px'
            });
        },

        _blockSliderResizeWidth: function() {
            var isEnabled = this._blockSliderIsEnabledOnScreenSizes();
            var $blockContainer = this.$el.find(".block-container");
            var $blocks = this.$el.find(".block");

            if (!isEnabled) {
                $blocks.css("width", "");
                $blockContainer.css(('margin-' + this.model.get('_marginDir')), "0px");
                return $blockContainer.css({"width": "100%"});
            }

            var $container = this.$el.find(".article-block-slider");
            var containerWidth = Math.round($container.width());
            $blocks.css("width", containerWidth + "px");

            var totalWidth = $blocks.length * (containerWidth);
            $blockContainer.width(totalWidth + "px");
        },

        _onBlockSliderDeviceChanged: function() {
            var isEnabled = this._blockSliderIsEnabledOnScreenSizes();

            if (isEnabled) {
                this.$(".article-block-toolbar, .article-block-progressbar").removeClass("display-none");
            } else {
                this.$(".article-block-toolbar, .article-block-progressbar").addClass("display-none");
                this.$('.block-inner').css("min-height","10px");
                this.$('.block-container').css(('margin-' + this.model.get('_marginDir')), "0px");
            }

            _.delay(function() {
                $(window).resize();
            }, 250);
        },

        _onBlockSliderPageScrollTo: function(selector) {
            this._disableAnimationOnce = true;
            _.defer(_.bind(function() {
                this._disableAnimationOnce = false;
            }, this));

            if (typeof selector === "object") selector = selector.selector;

            var isEnabled = this._blockSliderIsEnabledOnScreenSizes();
            if (!isEnabled) {
                return;
            }

            if (this.$el.find(selector).length === 0) return;

            var id = selector.substr(1);

            var model = Adapt.findById(id);
            if (!model) return;

            var block;
            if (model.get("_type") == "block") block = model;
            else block = model.findAncestor("blocks");
            if (!block) return;

            var children = this.model.getChildren();
            for (var i = 0, item; item = children.models[i++];) {
                if (item.get("_id") == block.get("_id")) {
                    _.defer(_.bind(function() {
                        this._blockSliderMoveIndex(i-1, false);
                    }, this));
                    return;
                }
            }
        },

        _onBlockSliderPageScrolledTo: function() {
          _.defer(_.bind(function() {
            this._blockSliderScrollToCurrent(false);
          }, this));
        },

        _onBlockSliderRemove: function() {
            this._blockSliderRemoveEventListeners();
        },

        _blockSliderRemoveEventListeners: function() {
            this.$(".component").off("resize", this._blockSliderResizeHeight);
            this.stopListening(Adapt, "device:changed", this._onBlockSliderDeviceChanged);
        }
    };

    return BlockSliderView;

});
