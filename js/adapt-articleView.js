define([
  'core/js/adapt',
  'core/js/views/articleView'
], function(Adapt, AdaptArticleView) {

  var BlockSliderView = {

    _isReady: false,
    _disableAnimationOnce: false,

    events: {
      'click [data-block-slider]': '_onBlockSliderClick'
    },

    preRender: function() {
      AdaptArticleView.prototype.preRender.call(this);

      if (!this.model.isBlockSliderEnabled()) {
        this.$el.addClass('is-disabled');
        return;
      }

      this._blockSliderPreRender();
    },

    _blockSliderPreRender: function() {
      Adapt.wait.for(function(done){
        this.resolveQueue = done;
      }.bind(this));
      this._blockSliderSetupEventListeners();
    },

    _blockSliderSetupEventListeners: function() {

      this._blockSliderResizeHeight = this._blockSliderResizeHeight.bind(this);

      this.listenTo(Adapt, {
        'device:resize': this._onBlockSliderResize,
        'device:changed': this._onBlockSliderDeviceChanged,
        'page:scrollTo': this._onBlockSliderPageScrollTo,
        'page:scrolledTo': this._onBlockSliderPageScrolledTo
      });

      this.listenToOnce(Adapt, 'remove', this._onBlockSliderRemove);
      this.listenToOnce(this.model, 'change:_isReady', this._onBlockSliderReady);

      var duration = this.model.get('_articleBlockSlider')._slideAnimationDuration || 200;

      this._blockSliderHideOthers = _.debounce(this._blockSliderHideOthers.bind(this), duration);
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

      Adapt.trigger(this.constructor.type + 'View:render', this);

      this.addChildren();

      this.$el.addClass('abs');

      var progressLoc = this.model.get('_articleBlockSlider')._progressLocation;

      if (progressLoc == 'top') {
        this.$('.is-bottom').remove();
        this.$('.abs__toolbar').addClass('top');
      }

      if (progressLoc == 'bottom') {
        this.$('.is-top').remove();
        this.$('.abs__toolbar').addClass('bottom');
      }

      if (progressLoc == 'none') {
        this.$('.is-top').remove();
        this.$('.is-bottom').remove();
        this.$('.abs__toolbar').addClass('none');
      }

      if (this.model.get('_articleBlockSlider')._fullWidth) {
        this.$el.addClass('is-fullwidth');
      }

      this.delegateEvents();

      this.$el.imageready(function() {
        _.delay(this._blockSliderPostRender.bind(this), 500);
      }.bind(this));

      return this;
    },

    _blockSliderConfigureVariables: function() {
      this.model.set('_marginDir', 'left');
      if (Adapt.config.get('_defaultDirection') == 'rtl') {
        this.model.set('_marginDir', 'right');
      }

      var slideWidth = Math.round(this.$('.block__container').width());
      var stage = this.model.get('_stage');
      var margin = -(stage * slideWidth);

      this.$('.block__container').css(('margin-' + this.model.get('_marginDir')), margin);

      var blocks = this.model.getChildren().models;
      var totalBlocks = blocks.length;
      var itemButtons = [];

      for (var i = 0, l = totalBlocks; i < l; i++) {
        itemButtons.push({
          _className: (i === 0 ? 'home' : 'not-home') + (' i'+i),
          _index: i,
          _includeNumber: i !== 0,
          _title: blocks[i].get('title')
        });
      }

      this.model.set({
        _currentBlock: 0,
        _totalBlocks: totalBlocks,
        _itemButtons: itemButtons
      });

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
      var _currentBlock = this.model.get('_currentBlock');
      var _totalBlocks = this.model.get('_totalBlocks');
      var $right = this.$el.find('[data-block-slider="right"]');
      var blocks = this.model.getChildren().models;

      if (blocks[_currentBlock].get('_isComplete') == true && (_currentBlock < (_totalBlocks - 1))) {
        $right.a11y_cntrl_enabled(true);
      }
    },

    _blockSliderConfigureControls: function(animate) {
      var duration = this.model.get('_articleBlockSlider')._slideAnimationDuration || 200;

      if (this._disableAnimationOnce) animate = false;
      var _currentBlock = this.model.get('_currentBlock');
      var _totalBlocks = this.model.get('_totalBlocks');

      var $left = this.$el.find('[data-block-slider="left"]');
      var $right = this.$el.find('[data-block-slider="right"]');

      if (this.model.get('_articleBlockSlider')._hasButtons && this.blockEnabled[_currentBlock]) {
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

      var $indexes = this.$el.find('[data-block-slider="index"]');
      $indexes.a11y_cntrl_enabled(true).removeClass('is-selected');
      $indexes.eq(_currentBlock).a11y_cntrl_enabled(false).addClass('is-selected is-visited');

      // Progress
      var $progress = this.$el.find('[data-block-slider-progress="index"]');
      $progress.removeClass('is-selected');
      $progress.eq(_currentBlock).addClass('is-selected is-visited');

      var $blocks = this.$el.find('.block');
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
      this.$('.abs__btn-tab').css({
        width: itemwidth + '%'
      });
    },

    _blockSliderPostRender: function() {
      this._blockSliderConfigureControls(false);

      this._onBlockSliderDeviceChanged();

      var startIndex = this.model.get('_articleBlockSlider')._startIndex || 0;

      this._blockSliderMoveIndex(startIndex, false);

      var blocks = this.model.getChildren().models;
      for (var i = 0, l = blocks.length; i < l; i++) {
        this.listenTo(blocks[i], 'change:_isComplete', this._onBlockComplete);
      }

      Adapt.trigger(this.constructor.type + 'View:postRender', this);
    },

    _onBlockSliderReady: function() {
      this._blockSliderHideOthers();
      _.delay(function(){
        this._blockSliderConfigureControls(false);
        this._onBlockSliderResize();
        this.resolveQueue();
        this._isReady = true;
      }.bind(this), 250);
      this.$('.component').on('resize', this._blockSliderResizeHeight);
    },

    _onBlockSliderClick: function(event) {
      event.preventDefault();

      if (this.navClicked) return;

      this.navClicked = true;

      var id = $(event.currentTarget).attr('data-block-slider');

      switch(id) {
      case 'left':
        this._blockSliderMoveLeft();
        break;
      case 'index':
        var index = parseInt($(event.currentTarget).attr('data-block-slider-index'));
        this._blockSliderMoveIndex(index);
        break;
      case 'right':
        this._blockSliderMoveRight();
        break;
      }
    },

    _blockSliderMoveLeft: function() {
      if (this.model.get('_currentBlock') === 0) return;

      var index = this.model.get('_currentBlock');
      this._blockSliderMoveIndex(--index);
    },

    _blockSliderMoveIndex: function(index, animate) {
      if (this.model.get('_currentBlock') != index) {
        this.model.set('_currentBlock', index);

        Adapt.trigger('media:stop');//in case any of the blocks contain media that's been left playing by the user

        this._blockSliderSetVisible(this.model.getChildren().models[index], true);
        this._blockSliderResizeHeight(animate);
        this._blockSliderScrollToCurrent(animate);
        this._blockSliderConfigureControls(animate);
      }

      var duration = this.model.get('_articleBlockSlider')._slideAnimationDuration || 200;

      if (this._disableAnimationOnce) animate = false;

      if (animate !== false) {
        _.delay(function() {
          $(window).resize();
        }, duration);
        return;
      }

      $(window).resize();
    },

    _blockSliderMoveRight: function() {
      if (this.model.get('_currentBlock') == this.model.get('_totalBlocks') - 1 ) return;

      var index = this.model.get('_currentBlock');
      this._blockSliderMoveIndex(++index);
    },

    _blockSliderScrollToCurrent: function(animate) {
      var isEnabled = this._blockSliderIsEnabledOnScreenSizes();
      var $container = this.$el.find('.abs__slide-container');

      if (!isEnabled) {
        return $container.scrollLeft(0);
      }

      var currentBlock = this.model.get('_currentBlock');

      var blocks = this.$el.find('.block');
      var blockWidth = Math.round($container.width());

      var totalLeft = this.model.get("_currentBlock") * blockWidth;

      this._blockSliderShowAll();

      var duration = this.model.get("_articleBlockSlider")._slideAnimationDuration || 200;

      var currentBlock = this.model.get("_currentBlock");
      var $currentBlock = $(blocks[currentBlock]);

      if (this._disableAnimationOnce) animate = false;
      if (this._disableAnimations) animate = false;

      var movementSize = Math.round(this.$('.abs__slide-container').width());
      var marginDir = {};

      if (animate === false) {
        _.defer(function(){
          marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * currentBlock);
          this.$('.block__container').css(marginDir);
          this._blockSliderHideOthers();
        }.bind(this));
      } else {
        marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * currentBlock);
        this.$('.block__container').velocity("stop", true).velocity(marginDir);
        this._blockSliderHideOthers();
      }
    },

    _blockSliderIsEnabledOnScreenSizes: function() {
      var isEnabledOnScreenSizes = this.model.get('_articleBlockSlider')._isEnabledOnScreenSizes;

      var sizes = isEnabledOnScreenSizes.split(' ');
      if (_.indexOf(sizes, Adapt.device.screenSize) > -1) {
        return true;
      }
      return false;
    },

    _blockSliderShowAll: function() {
      this._blockSliderHideOthers.cancel();

      this.model.getChildren().models.forEach(function(block) {
        this._blockSliderSetVisible(block, true);
      }.bind(this));
    },

    _blockSliderHideOthers: function() {
      var currentIndex = this.model.get('_currentBlock');
      this.model.getChildren().models.forEach(function(block, index) {
        var makeVisible = (index === currentIndex);
        this._blockSliderSetVisible(block, makeVisible);
      }.bind(this));
    },

    _blockSliderSetVisible: function(model, makeVisible) {
      this.$el.find("." + model.get('_id') + " *").css("visibility", makeVisible ? "" : "hidden");
    },

    _onBlockSliderResize: function() {
      this._blockSliderResizeWidth(false);
      this._blockSliderResizeHeight(false);
      this._blockSliderScrollToCurrent(false);
      this._blockSliderResizeTab();
      Adapt.trigger('blockslider:resize');
    },

    _blockSliderResizeHeight: function(animate) {
      if (!this._isReady) animate = false;
      var $container = this.$el.find('.abs__slide-container');
      var isEnabled = this._blockSliderIsEnabledOnScreenSizes();

      var minHeight = this.model.get('_articleBlockSlider')._minHeight;

      if (!isEnabled) {
        this._blockSliderShowAll();
        return $container.velocity('stop').css({'height': '', 'min-height': ''});
      }

      var currentBlock = this.model.get('_currentBlock');
      var $blocks = this.$el.find('.block');
      var $blockInners = this.$el.find('.block__inner');

      if (minHeight) {
        $blockInners.css({'min-height': minHeight+'px'});
      }

      var currentHeight = $container.height();
      var blockHeight = $blocks.eq(currentBlock).height();

      var maxHeight = -1;
      $container.find('.block').each(function() {
        if ($(this).height() > maxHeight) {
          maxHeight = $(this).height();
        }
      });

      var duration = (this.model.get('_articleBlockSlider')._heightAnimationDuration || 200) * 2;

      if (this._disableAnimationOnce) animate = false;

      if (this.model.get('_articleBlockSlider')._hasUniformHeight) {
        if (animate === false) {
          $container.css({'height': maxHeight+'px'});
        } else {
          $container.velocity('stop').velocity({'height': maxHeight+'px'}, {duration: duration });//, easing: 'ease-in'});
        }
      } else if (currentHeight <= blockHeight) {

        if (animate === false) {
          $container.css({'height': blockHeight+'px'});
        } else {
          $container.velocity('stop').velocity({'height': blockHeight+'px'}, {duration: duration });//, easing: 'ease-in'});
        }

      } else if (currentHeight > blockHeight) {

        if (animate === false) {
          $container.css({'height': blockHeight+'px'});
        } else {
          $container.velocity('stop').velocity({'height': blockHeight+'px'}, {duration: duration });//, easing: 'ease-in'});
        }
      }

      if (minHeight) {
        $container.css({'min-height': minHeight+'px'});
      }
    },

    _blockSliderResizeTab: function() {
      if (!this.model.get('_articleBlockSlider')._hasTabs) return;

      this._blockSliderSetButtonLayout();

      this.$('.abs__btn-tab').css({
        height: ''
      });

      var parentHeight = this.$('.abs__btn-tab').parent().height();
      this.$('.abs__btn-tab').css({
        height: parentHeight + 'px'
      });

      var toolbarHeight = this.$('.abs__toolbar').height();
      var additionalMargin = '30';
      this.$('.abs__toolbar').css({
        top: '-' + (toolbarHeight + (additionalMargin/2)) + 'px'
      });

      var toolbarMargin = parseFloat(toolbarHeight) + parseFloat(additionalMargin);
      this.$('.abs__slide-container').css({
        marginTop: toolbarMargin + 'px'
      });
    },

    _blockSliderResizeWidth: function() {
      var isEnabled = this._blockSliderIsEnabledOnScreenSizes();
      var $blockContainer = this.$el.find('.block__container');
      var $blocks = this.$el.find('.block');

      if (!isEnabled) {
        $blocks.css('width', '');
        $blockContainer.css(('margin-' + this.model.get('_marginDir')), '0px');
        return $blockContainer.css({'width': '100%'});
      }

      var $container = this.$el.find('.abs__slide-container');
      var containerWidth = Math.round($container.width());
      $blocks.css('width', containerWidth + 'px');

      var totalWidth = $blocks.length * (containerWidth);
      $blockContainer.width(totalWidth + 'px');
    },

    _onBlockSliderDeviceChanged: function() {
      var isEnabled = this._blockSliderIsEnabledOnScreenSizes();

      if (isEnabled) {
        this.$('.abs__toolbar, .abs__progress').removeClass('u-display-none');
      } else {
        this.$('.abs__toolbar, .abs__progress').addClass('u-display-none');
        this.$('.block__inner').css('min-height','10px');
        this.$('.block__container').css(('margin-' + this.model.get('_marginDir')), '0px');
      }

      _.delay(function() {
        $(window).resize();
      }, 250);
    },

    _onBlockSliderPageScrollTo: function(selector) {
      this._disableAnimationOnce = true;
      _.defer(function() {
        this._disableAnimationOnce = false;
      }.bind(this));

      if (typeof selector === 'object') selector = selector.selector;

      if (!this._blockSliderIsEnabledOnScreenSizes()) {
        return;
      }

      if (this.$el.find(selector).length === 0) return;

      var id = selector.substr(1);

      var model = Adapt.findById(id);
      if (!model) return;

      var block;
      if (model.get('_type') == 'block') block = model;
        else block = model.findAncestor('blocks');
      if (!block) return;

      var children = this.model.getChildren();
      for (var i = 0, item; item = children.models[i++];) {
        if (item.get('_id') == block.get('_id')) {
          _.defer(_.bind(function() {
            this._blockSliderMoveIndex(i-1, false);
          }, this));
          return;
        }
      }
    },

    _onBlockSliderPageScrolledTo: function() {
      _.defer(function() {
        this._blockSliderScrollToCurrent(false);
      }.bind(this));
    },

    _onBlockSliderRemove: function() {
      this._blockSliderRemoveEventListeners();
    },

    _blockSliderRemoveEventListeners: function() {
      this.$('.component').off('resize', this._blockSliderResizeHeight);
      this.stopListening(Adapt, 'device:changed', this._onBlockSliderDeviceChanged);
    }
  };

  return BlockSliderView;

});
