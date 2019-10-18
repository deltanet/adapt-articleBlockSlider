# adapt-articleBlockSlider

**Article Block Slider** is a Kineo *presentation extension*.

The extension changes the presentation of an article's blocks from being vertically stacked to horizontally ordered. This is achieved by implementing a left and right or tabbing navigational element to the article. By default, the **Article Block Slider** is available on large resolutions only (medium and small resolutions can be added but are currently unsupported). When viewing at other resolutions the blocks return to being vertically stacked.

## Installation

This extension must be manually installed.

If **Article Block Slider** has been uninstalled from the Adapt authoring tool, it may be reinstalled using the [Plug-in Manager](https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager).  

## Settings Overview  

**Article**

**_articleBlockSlider** (object): The Article Block Slider object that contains values for **_isEnabled**, **_slideAnimationDuration**, **_heightAnimationDuration**, **_isEnabledOnScreenSizes**, **_hasTabs**, **_hasArrows**, **_startIndex**, **_hasUniformHeight**, and **_minHeight**.

>**_isEnabled** (boolean): Turns Article Block Slider on and off. Acceptable values are `true` and `false`.

>**_slideAnimationDuration** (number): Sets the slide duration, in milliseconds, of the animation between blocks.

>**_heightAnimationDuration** (number): Sets the duration, in milliseconds, of the animation between varying blocks' heights.

>**_isEnabledOnScreenSizes** (string): Defines which screen sizes the Article Block Slider displays the navigation elements on. Acceptable values are `"large"`, `"medium"` and `"small"` or combinations thereof as a space-separated list e.g. `"large medium"`.

>**_hasButtons** (boolean): Turns the button navigation on and off. If `_hasButtons` is set to true, you must set `_hasTabs` and `_hasArrows` to false. Acceptable values are `true` and `false`.

>**_hasTabs** (boolean): Turns the tab navigation on and off. If `_hasTabs` is set to true, you must set `_hasButtons` and `_hasArrows` to false. Acceptable values are `true` and `false`.

>**_hasArrows** (boolean): Turns the arrow navigation on and off. If `_hasArrows` is set to true, you must set `_hasButtons` and `_hasTabs` to false. Acceptable values are `true` and `false`.

>**_startIndex** (number): Sets which block displays on page load.

>**_hasUniformHeight** (boolean): Sets all elements within the Article Block Slider to use the highest blocks height. Acceptable values are `true` and `false`.

>**_minHeight** (number): Sets a minimum height on the `.article-block-slider` container class.

**Block**
The **Article Block Slider** attribute group at block level contains values for **_isEnabled**, **forward**, and **back**.  

>**_isEnabled** (boolean): Turns Article Block Slider on and off. Acceptable values are `true` and `false`.

>**forward** (string): Defines the button text for navigating to the next block.

>**back** (string): Defines the button text for navigating to the previous block.

## Limitations

Only one navigation element (Arrows or Tabs) should be active at any one time.  

The **Article Block Slider** and **Quicknav** extensions don't interact well together when the **Article Block Slider** is the last article on a page with an enabled **Quicknav.**  

----------------------------
**Version number:**  3.1.1  
**Framework versions:**  4+  
**Author / maintainer:** Kineo / DeltaNet  
**Accessibility support:** WAI AA  
**RTL support:** Yes  
**Cross-platform coverage:** To be confirmed  
