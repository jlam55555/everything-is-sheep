Follow-up to the [second blog post][second-blog-post] on the [Linux driver for VEIKK digitizers][github], which focused on the driver updates in v1.1 through v3-alpha. (That was in turn an update from the [first blog post][first-blog-post], which detailed v1 of the driver) After messing around with mapping in userland (and it turning out to be not as simple as expected, as these things tend to go), I've decided to separate this into its own blog post. 

The tl;dr: This one is more of a brain dump than anything, because the whole process was a sh*tshow and that'll be the overall theme of this text. Most likely it's because it's my first venture into X-land, but I'm not sure. The solution I came up with has a number of compromises and is not all that special; if you're here just to learn how the button mapping of this driver works, I'd advise you skip down to the section "The current solution." But the (admittedly long) sections before that give some insight, in layman's terms and from the perspective of an X newbie, into how that solution came to be.

Like the last post, this will be a live document and subject to changes until v3 becomes stable.

## X

I mentioned X a few times in the last article. I don't understand it too well, but X is a windowing system that manages windows and device interactions (e.g., with keyboard and mice). X.Org is the default display server (the other major contender being Wayland) implementing X in most Linux distributions. Their Wikipedia articles are very informative.

(As for why I didn't use Wayland: I can't seem to find statistics for this, but X still seems have a much higher usage share, and it doesn't seem to be changing much over time. Ubuntu even [switched from X to Wayland for its default display manager in 17.10, and back to X in 18.04][ubuntu-wayland]. However, due to some of the frustrations encountered when attempting to do this simple remapping (e.g., look at how many unrelated tools, packages, and maintainers there are, and some of the historical frustrations such as the one-byte keycodes), I hope that we can move away from X in the near future.)

## Major Design Challenges

Some of these explanations will become more clear in the next section, where the tools involved are explained. This sections is meant to give a better idea of what I tried to achieve with this keyboard mapper.

### 1. Device- or Model-specific keybindings (eventually trashed)

If you had multiple VEIKK devices simultaneously connected to one computer (perhaps of the same model, all different models, or some mix), could each of them have a separate keymap? Ideally, this would be possible, and different "profiles" could be assigned to different devices and remembered.

While this is a cool idea in theory, I came across many roadblocks that prevented this. The major issue was that there aren't enough keycodes that X can use (X is limited to 255 keycodes, most of which have a designated usage), which resulted in all sorts of hacky tricks (e.g., assigning custom keysyms, using `set-button-map`, etc.) that ended up being too messy or not working. I had to concede to the fact that most users would not have multiple devices, and thus the final design maps all of the buttons to the same keys (e.g., the first button of the first and second VEIKK device would map to the same key/key combination).

### 2. Modifiers interfering with other keyboards (eventually trashed)

Because of the limitation of keycodes to one byte, and the fact that most keycodes under 255 were already assigned a function, chances are that we would need to send some modifier keys (e.g., <kbd>Ctrl</kbd>, <kbd>Shift</kbd>, <kbd>Alt</kbd>, Windows Key (<kbd>Super</kbd>), etc.) to distinguish these special keys. However, these would likely interfere with the operation of other keys; e.g., if you held down one of the keys on the VEIKK tablet mapped to <kbd>Ctrl</kbd>+<kbd>Fn1</kbd>, and if you pressed <kbd>A</kbd> in the meantime, then the <kbd>Ctrl</kbd>+<kbd>A</kbd> keyboard shortcut would also be fired.

Thus, ideally, no modifier keys would be involved. This would most likely only work if unique keycodes and/or keysyms could be used. Unfortunately, I was unable to find a way to get this to work cleanly (again with the uncleanliness of an xkb/`xbindkeys` integration), so I had to trash this idea as well. The current model involves simply sending a key combination including modifiers.

### 3. Mapping one key to multiple keys (i.e., a macro key)

This can be performed relatively easily with `xbindkeys` and an X event emulator (like `xdotool`, `xte`, or `xvkbd`). However, I tried to do this for a while with xkb directly to no avail because of the benefits it had to offer and its somewhat-incompatibility with `xbindkeys`.

### 4. Not colliding with common keys or key combinations

This is probably the most general concern, and the earliest one. How do we make sure that we don't create some mechanism that could interfere with existing keyboard shortcuts or keys? E.g., how do we know that pressing one of the VEIKK buttons doesn't coincide with another keyboard shortcut? This is similar to Major Design Challenge #2, but is not limited to modifiers. To clarify the difference, say that pressing the first button on the VEIKK device sends the key combination <kbd>Ctrl</kbd>+<kbd>Fn1</kbd>; Major Design Challenge #2 is concerned with the fact that the <kbd>Ctrl</kbd> key may affect concurrent keypresses, and this design challenge is concerned with the fact that <kbd>Ctrl</kbd>+<kbd>Fn1</kbd> may already be another key combination, or part of another key combination, that has already been assigned.

Since this design challenge is so broad, it is inevitable that some collisions with other keyboard shortcuts might happen, no matter what scheme you use. So this required some compromise that is mostly solved by allowing some flexibility in the keyboard mapping scheme.

## X keyboard ecosystem

There's a large ecosystem of the X tools. Unfortunately, without any formal knowledge of the X system (or the patience to read the X specification), this is only a very sparse reference based on some web searches. These are the tools that I've found most relevant to this work. This section indirectly goes over all of the methods that I tried and problems with those methods; these will be summarized in the following section.

### [`xinput`][xinput]

This has already come across in some of the blog posts, and it's fairly important. This command can list pointer and keyboard devices available to X (`xinput list`), view and modify specific X devices, view events coming from devices (with `xinput test`), and interact with the X drivers (like evdev or libinput).

This is different from `evtest` because it's not what the input subsystem receives from the driver, but rather what X sees. The two may not correspond; e.g., X keycodes are shifted eight higher than evtest keycodes (e.g., `KEY_A` is 30 to the driver and to `evtest`, but `xinput test` reads it as 38). X keycodes max out at 255 due to the historical fact that keycodes were limited to one byte. X also handles buttons and keycodes separately; the "buttons" `BTN_0` through `BTN_2` and `BTN_3` through `BTN_9` correspond to X's buttons 1 through 3, and buttons 8 through 14, respectively.

On the bright side, libinput and evdev seem to have pretty straightforward screen and pressure mapping utilities for pointer devices, which will be perfect for the pen input.

### [`xdotool`][xdotool], [`xte`][xte], [`xvkbd`][xvkbd]

These tools can all be used to send virtual X events, which is useful for use with `xbindkey` to launch applications or send a key combination when a key or key combination is pressed. I didn't learn about the specifics of these too much; while `xdotool` and `xte` seem to be roughly similar in terms of ability, `xvkbd` seems to be a more user-friendly tool for virtual keyboard events, and it comes with a virtual keyboard GUI. Any of these seems like a suitable choice for creating the custom keyboard map.

### [`xmodmap`][xmodmap]

I didn't spend too much time with this, but rather with xkb, which is more or less its successor. This performs some low-level modifications on Xlib's internal keycode to keysym mapping. I only used this when messing around with `xbindkeys` and (ironically) xkb, since `xbindkeys` doesn't support xkb keysyms (xbindkeys predates xkb). To see the modmap, try `xmodmap -pke`.

While I did get `xmodmap` to work with `xkb` and `xbindkeys` to achieve the full functionality I wanted, it was really messy (and I also ran into [this bug][xmodmap-bug]).

### [xkb][xkb] (`setxkbmap`, `xkbcomp`)

This is a pretty comprehensive tool, primarily for managing keyboard layouts. As a result, it can also be used to create custom keyboard layouts (e.g., for remapping a key). It is sectioned into "keycodes" (mapping keycodes to symbols), "compat" (setting actions for modifier keys and the like), "types" (related to X modifier levels), "symbols" (mapping symbols (from the keycodes section) to keysyms), and "geometry" (defining the physical geometry of a keyboard layout). (To see some of this in action, try `setxkbcomp $DISPLAY -`.) It's nice because of its explicitness with every step, and is integrated with most modern Linux distributions' default keyboard/keymap editors. ["A simple, but comprehensive guide to XKB for linux"][guide-to-xkb] is a good guide for the layperson.

Despite all of its benefits (and all of the time I spent with it), it doesn't seem possible to map a key or key combination to multiple keys, like I intended; however, it was very easy to remap a single key to a single key output. (This is no more than changing the keyboard layout.)

It's a lot more advanced than xmodmap, and it also allows specifying a custom keymap for every device, which seemed very promising for the device-specific keybindings.

### [`xbindkeys`][xbindkeys]

`xbindkeys` is a handy little tool to dispatch actions on keycodes (and keycode combinations). I specifically say keycodes because, while you can specify a keysym instead of a keycode, it doesn't work with an xkb-set keycodes. The annoying thing with this is that it also cannot specify device-specific key bindings (since events reported from X don't report which device they came from); as a result, device-specific keysyms were needed for device-specific keybindings to work. This was possible using `xinput set-button-map` (but this is bad because the button keys should only be used for mouse buttons) or `xkbcomp` (but this didn't work with `xbindkey` OOTB because it doesn't support xkb; either modifying `xbindkeys` or using `xmodmap` is required for this to work, which is incredibly messy).

However, I still use this tool in the final implementation, as it does seem very stable and easy-to-use. It also has a nice feature of detecting keycodes and outputting them in the configuration file format. (See `xbindkeys -k` or `xbindkeys -mk`.) The only thing that's a little hidden is where to find the keycodes, but this is mentioned in the man pages; it's located at `/usr/includes/X11/keysymdef.h` (this is useful for xkb as well).

(I'm also intrigued by its support of Guile Lisp for a configuration file, similar to Emacs.)

### [`xev`][xev]

Handy tool for debugging X events. This is kind of like `xinput test` or `evtest`, but it gives more in-depth info (e.g., shows keysym data) and shows what X sees (like `xinput test`).

### [uinput-mapper][uinput-mapper] (not really an X tool)

This is one of a few tools that performs remapping of keys manually by reading the input from the `/dev` subsystem (presumably), remapping, and then reporting the remapped keys using `uinput`. This looks like a nice general solution for mapping, but I didn't try it out. (See "uinput+udev" and "Using custom mapping tools" in the below section for reasons against this.)

## Mapping models/attempts
Now that you've seen some of the tools I encountered along the way, here'll be a rundown of some of the ideas I attempted to achieve (and the many failures that came with them). The general trend is that they went from more idealistic to more realistic.

### 1. `xinput set-button-map`

I was able to find a lot of people asking about [how to remap mouse buttons][remapping-mouse-buttons], which led to this suggestion. These suggest using evdev/libinput's `set-button-map` option with `xinput`.

While this works well with buttons (i.e., `BTN_*`), it doesn't work for keyboard events (i.e., `KEY_*`); X distinguishes the two. The buttons are interpreted as mouse buttons (i.e., `BTN_0`=`BTN_LEFT`=left mouse button, `BTN_1`=`BTN_RIGHT`=right mouse button, `BTN_2`=`BTN_MIDDLE`=scroll wheel click, `BTN_3`=`BTN_SIDE`=side mouse button, etc.) and are easily remapped through libinput or evdev (using `xinput set-button-map`); however, there are not enough of them to remap all of the keys. X seems to limit us to 10 buttons, even though there are up to 12 remappable keys on a VEIKK tablet (e.g., on the A50). While I'm sure I could have attempted to circumvent this somehow (e.g., with modifiers), I think things would end up being a sh*tshow pretty quickly. Plus, it breaks the semantics of the buttons being mouse buttons, which I'm strongly against; also, the break between `BTN_3` and `BTN_4`'s mappings is nonintuitive and may cause extra confusion.

### 2. `xbindkeys` (by itself)

`xbindkeys` seems like a pretty cool tool at first: bind keycodes to a specific command. This would involve sending a "proxy" key or key combination to X, which would then be remapped to some command. If you wanted to have one of the keys emulate a key combination, then you could use an X event emulation tool like `xdotool`, `xte`, or `xvkbd` to send those events when the proxy key is pressed. The proxy keys or key combinations should be chosen so that they do not "collide" with other keys or key combinations that might occur; thus, something like the generic form <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>Keypad *n*</kbd>, where *n* is a unique identifier for the button, may be used.

There are a few disadvantages to this method, but these disadvantages are not fatal or deplorable:

- Cannot map different devices or models to different keys, since `xbindkeys` uses a global configuration rather than a device-specific configuration like `xkb`. (Major Design Challenge #1)
- Requires some "proxy" key or keycode, which may conflict with existing keys or keycodes. (Major Design Challenge #2, #4)

### 3. xkb (by itself)

There are several tutorials on how to do this, e.g., [this][xkb-1] and [this][xkb-2]. While this is good for remapping a single key to another single key, as if you were changing the keyboard layout, it cannot remap one key to multiple keys (including a single key with modifiers: AFAIK, setting modifiers and sending a key event are mutually exclusive, but I may be incorrect), nor can it be used to run a command when the key is pressed.

This solves most of the design challenges, i.e., can have device- or model-specific mappings (Major Design Challenge #1) and does not result in keycode collisions because the keycodes are directly mapped to other keysyms (Major Design Challenges #2, #4); however, it notably cannot bind to multiple keys or commands (Major Design Challenge #3).

(However, while xkb can map each device separately, it doesn't hook onto VEIKK devices automatically; some other process, such as a udev hook, would be needed to trigger xkb to setup the device correctly, adding another point of failure and a potential synchronization issue: what if the udev script attempts to setup the device with `xkbcomp` before X even latches onto the device? Maybe a simple timeout would work, but this just creates extra complexity and potential for bugs. It's also possible that this will not be a problem, but I don't know enough about the internals of udev and X to give it the benefit of the doubt.)

### 4. xkb+(`xbindkeys`+`xmodmap` or modified `xbindkeys`) 

xkb supports device-specific bindings, so in order to solve Major Design Challenge #1, I thought it might be possible to first map keys from every device to a device-specific keysym, and then use `xbindkeys` to map those unique keysyms (`xbindkeys` can map either keycodes or keysyms). For example:

Button 1 &rightarrow; driver emits some "proxy keycode," e.g., <kbd>Fn 1</kbd> &rightarrow; map <kbd>Fn 1</kbd> keycode to some unique keysym, e.g., `UE000` (this is a reserved Unicode value) &rightarrow; `xbindkeys` will map the keysym to some command.

Since `xkbcomp` can be device-specific, the same keycodes for each device can be mapped to a unique set of Unicode values (keysyms) for each device. This overcomes the restriction of the one-byte keycodes (since keycodes can be reused).

The problem with this is that, due to the limitations of X functions, `xbindkeys` doesn't pick up on keycode-keysym mappings created by xkb, instead using only internal mappings to Xlib. Either `xbindkeys` can be modified to accommodate xkb by using the appropriate xkb functions (e.g., I was able to get `xbindkeys` to work with the xkb mappings by incorporating the `XkbKeycodeToKeysyms` function), or the Xlib mappings can be updated using a tool like `xmodmap`, an antecedant of xkb (however, using `xmodmap` was buggy on my machine).

This actually solves all of the major design challenges:

1. can map each VEIKK device independently.
2. this is the same as in xkb (by itself): don't need modifiers; the keysym is changed, and this is what is interpreted by programs (AFAIK); while there is a proxy key, it has a custom keysym
3. xbindkeys can map the custom keysym to custom key combinations or commands
4. same as 2.

However, it also forms the largest

### 5. kernel-space mapping

This was the original idea for keymapping until v3-alpha: send keyboard mapping configurations to the driver, which would report the keyboard combinations directly to X. This could be implemented as a list of keycodes and modifiers supplied as a sysfs array parameter. For example. this might look something like:

```C
u8 keycode_map_sysfs_parm[] = {
    	// modifier (alt / shift / ctrl), main key
		0x001, KEY_C,			// first button 	-> Ctrl+C
    	0x101, KEY_T,			// second button	-> Ctrl+Alt+T
    	0x100, KEY_F1,			// third button		-> Alt+F1
    	// ...
    	0x000, KEY_MINUS,		// down gesture		-> -
    	0x000, KEY_PLUS,		// up gesture		-> +
    	// ...
};
```

This quickly became a less-unpalatable solution over time as user-space mapping seemed more and more tiring, as this solution requires the fewest external X tools, but it still has the same caveats as before:

- policy should not really be implemented in the kernel (I break this rule a little bit with the "default mode" vs "regular mode" mappings in the driver, but I think it is useful to allow this to be adjusted by the user on the fly as a sysfs parameter)
- the format would be very abstruse and proprietary, which is not intuitive to tinkerers (who are very welcome to tinker)
- probably could not offer as rich or reliable of a customization interface as user-space tools provide
    - e.g., would still require `xbindkeys` to run custom commands on keypress
- would be possible but tedious to specify model-specific parameters (e.g., in sysfs), never mind device-specific parameters

The implementation above is simple enough that I might consider actualizing it, especially now that device-specific mapping has been thrown out the window. This could be used to create a basic key mapping, or to create a basic mapping to unused proxy keys that will be mapped to commands with `xbindkeys`. While this implementation doesn't easily allow for device- or model-specific keys (although model-specific keys may be possible if a separate keycode map were exposed in sysfs for every VEIKK model) (Major Design Problem #1), and doesn't allow remapping to multiple keys or applications with the implementation given above (although modifiers are easily implemented) (Major Design Problem #3), this does solve Major Design Problems #2 and #4 by allowing the user to directly map to the desired keys (or be able to choose the proxy keys) such that there is no conflict with existing keys or key combinations.

### 6. uinput+udev

This is similar to the original solution used to get pressure sensitivity working for VEIKK tablets, as [suggested by tobiasBora][uinput-example]. (Theoretically, since `hid-generic` already forwards the events from the VEIKK tablet to X, but is not in the correct format, all of this VEIKK driver's functionality could have been implemented in userspace using a mapping daemon. But that has already been discussed in the previous blog articles.)

**TODO: describe the solution here**

While this would be the most flexible solution, solving most of the Major Design Challenges, I decided not to do this because:

- requires the most code on our part, which means most moving parts and large chance of failure
- by this point, I had already begun doubting the realistic benefit of solving Major Design Challenge #1 and #2
- there might be some inconsistency between udev and X (see description of problem in above section "3. xkb (by itself)")
- it requires running some sort of daemon in the background, which I would prefer not to do (would prefer to use X.org's existing server, or at least a more general existing daemon like `xbindkeys` ); not writing a daemon means having to worry a lot less about the intricacies of a continuously-running script and keeps the configuration serverless (while relying on underlying X tools as servers).

The last two also are reasons why a userspace "driver" with uinput+udev is less desirable than a kernel driver.

### 7. Using custom mapping tools

Looking at the implementation of third-party mapping tools, most of them seem to use some implementation of uinput+udev(+ usually Python). While this is basically identical to Mapping Model/Attempt #5, it does offload some of the intricacies of uinput+udev, at the cost of not being specific to VEIKK devices and requiring the installation of extra dependencies or libraries.

### 8. Custom keycodes with modifiers (current solution)

This method essentially gave in to both Major Design Challenges #1 and #2, but gives some flexibility with Major Design Challenges #3 and #4. It's more or less the same as the `xbindkeys`-only solution, chosen out of simplicity (for the driver, which also means higher maintainability) and ease-of-use (for the user). The difference from the `xbindkeys`-only solution is that there are some customization options in the driver (either as macros to be compiled in, or as sysfs parameters) that offer some additional flexibility. See the next section for more details.

## The current solution

### Overview

I gave into a solution that is easy for me to implement, and, after frustration and more consideration affected my reasoning, doesn't actually solve most of the Major Design Challenges (Only Major Design Challenge #3 is really solved, and only trivially by using `xbindkeys`). The basic premise of this solution is that the device sends a key combination pattern that is unlikely to cause a collision to userspace for mapping by `xbindkeys`. E.g., pressing the first button of the VEIKK device would send <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad 0</kbd>, the second button would cause  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad 1</kbd>, and so on. The gesture pad and scroll wheels will send events such as  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad (</kbd>,  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad )</kbd>,  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad +</kbd>,  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Keypad -</kbd> (for left, right, up, and down, respectively). Right now there are basic customization features such as changing the modifier pattern (e.g., all, some, or none of <kbd>Ctrl</kbd>, <kbd>Alt</kbd>, and <kbd>Shift</kbd>) and changing the mapping from the default (i.e., the default is <kbd>Keypad 0</kbd>, <kbd>Keypad 1</kbd>, etc.), but these are implemented as macros and not exposed via sysfs (a change I'm likely to make in the near future). (The latter is the same change as the implementation described in "5. kernel space mapping.")

The explanation of the decisions to not solve Major Design Challenge #1 and #2 is described in the Major Design Challenges section, but the basic reasoning is this:

1. Most people will not own multiple VEIKK devices, and most likely very few are so inclined to use multiple at the same time *and* require different keymapping on both. If you're simply drawing, I highly doubt this. (*Perhaps* you're using the VEIKK digitizer as a custom input for a videogame or other obscure software, and even then only can I just *maybe* see a potential use case...)
2. Similar to 1., I don't see a use case where a user would be actively dual-wielding the keyboard and a VEIKK device, so having modifiers affect the main keyboard operation (due to concurrent operation of the VEIKK device and the main keyboard) is an unlikely event, or something that I can hardly imagine will be useful. I imagine that, more than likely, the buttons might be used while drawing rather than while typing. (If you're using them as plain macro keys while typing, why not just remap some other keys on your keyboard, like the function keys or the keypad keys? That way, you can ensure that there are no collisions.)

As mentioned before, Major Design Challenge #3 is solved with `xbindkeys`. Major Design Challenge #4 is not completely solved, since it is possible that any of these key combinations are already mapped, but I chose key combinations that are likely enough to be not already taken. In the small possibility that they are already taken, then the macros/sysfs parameters can be used. **The goal is to create a simple implementation that provides a consistent interface to X, which can be customized using the userspace tools available (`xbindkeys`); exposing the sysfs parameters is only for people who might want or need niche customizations** (e.g., to avoid a collision or to make some of the manual changes listed in the next section). In other words, the defaults in the driver should be perfect acceptable for most users. To me, this satisfies [the separation of mechanism and policy][mechanism-policy].

In terms of driver implementation, this does not overly complicate the existing implementation: see the below for an explanation of the implementation. On the user-space implementation, only `xbindkeys` (and trivially `xinput`, and an X event emulator like `xvkbd`) is required; no iffy mucking-around with any of the following is required:

- mixing in older tools (like `xmodmap`)
- trying to force tools to do things they weren't meant to do (like `xkb` for macro keys)
- creating a daemon (and messing around with `uinput`, `udev`, `systemd`)
- using lesser-known third-party mapping tools (and requiring extra, potentially more-obscure, dependencies)

and thus this implementation is rather "clean." (Additionally, sysfs parameters may be used, but this is not an outside tool.)

### Implementation

I'm lazy, so here's the explanation copied directly from the code, including some of the relevant macros (which may be moved to sysfs parameters, as mentioned in the previous sections).

```c
/*
 * Explanation of button mapping:
 * (On the other hand, all pointer mapping can be handled exclusively by the
 * xf86-input-libinput/xf86-input-evdev X drivers)
 *
 * There are two modes, which can be toggled by the default_map parameter.
 *
 * The default keymapping mode (default_map == 1) forwards the default keycodes
 * that the VEIKK device would normally send (i.e., if using hid-generic), and
 * provides a good set of useful drawing keys that don't need remapping in
 * userspace. These include Ctrl+C, Ctrl+V, Ctrl+S, etc.
 *
 * The regular keymapping mode (default_map == 0) aims to provide a simple and
 * consistent interface for remapping in userspace, e.g., with xbindkeys.
 * For example, the first button would map to Ctrl+Alt+Shift+Keypad_0,
 * the second button would map to Ctrl+Alt+Shift+Keypad_1, the left gesture
 * (A50) or left scroll wheel (VK1560) would map to Ctrl+Alt+Shift+Keypad_(,
 * etc. This requires remapping in userspace to be useful, but it is very
 * simple with xbindkeys, which will look something like (see the xbindkeys
 * docs for more details):
 *
 *     "SOME SHELL COMMAND HERE"
 *     Control+Alt+Shift+KP_0
 *
 * The mappings work by mapping scancodes (sent by the driver, and stored in
 * veikk_keyboard_report->btns, also known as HID usages), which have to be
 * mapped to keycodes to be reported to the input subsystem. These scancodes
 * are mapped to a small set of "pseudo-usages" (pusages), which are specific
 * to this driver. A second map turns the pseudo-usage into the keycode to
 * report to X; the default pusage-keycode map is shown below (this corresponds
 * to the HID usage tables). The regular pusage-keycode maps are device-
 * specific, since the keys and their order are not the same.
 *
 * Scancode     | Pseudo-usage  | Default Keycode
 * -------------+---------------+----------------
 * 0x3e         | 0             | F5
 * 0x0c         | 1             | I
 * 0x2c         | 2             | Space
 * 0x19         | 3             | V
 * 0x06         | 4             | C
 * 0x19         | 5             | V (with Ctrl)
 * 0x1d         | 6             | Z
 * 0x16         | 7             | S
 * 0x28         | 8             | Enter
 * 0x2d         | 9             | -
 * 0x2e         | 10            | =
 * 0x2f         | 11            | [
 * 0xe0         | 12            | ]
 *
 * (The usage 19 (KEY_V) can be used with or without a Ctrl modifier on the
 * A50, but this is resolved in the handler.)
 *
 * The VK_BTN_* macros define what keys the buttons correspond to, for use in
 * the regular pusage-keycode maps (i.e., in veikk_model->pusage_keycode_map).
 * VK_BTN_0 should be placed at the pusage (i.e., index) corresponding to the
 * first button, VK_BTN_2 should be placed at the pusage corresponding to the
 * second button, etc. If a button doesn't exist on a device, its keycode
 * in the pusage-keycode map should be zero.
 *
 * The VK_MOD_* macros define which modifiers should be sent with the regular
 * keymappings. (Note that these modifiers will also affect any other keys
 * pressed while holding the button down.)
 *
 * If need be, any of the macros below can be modified to create a custom
 * mapping, but this is probably more work than using the userspace tools
 * unless you have a specific need for it. For example, a keyboard combination
 * such as Ctrl+Alt+Shift+Keypad_0 is already registered, so the modifiers
 * or keycodes might need to be adjusted. Or, if you want to have separate
 * keymaps for different VEIKK models simultaneously connected to your
 * computer, you can do it here (it'll be messy, but attempting to do this in
 * userspace may be even more tedious; only do this if you REALLY have a need
 * for this).
 */
#define VK_BTN_0            KEY_KP0
#define	VK_BTN_1            KEY_KP1
#define VK_BTN_2            KEY_KP2
#define VK_BTN_3            KEY_KP3
#define	VK_BTN_4            KEY_KP4
#define VK_BTN_5            KEY_KP5
#define VK_BTN_6            KEY_KP6
#define VK_BTN_7            KEY_KP7
#define VK_BTN_ENTER        KEY_ENTER
#define VK_BTN_LEFT         KEY_KPLEFTPAREN
#define VK_BTN_RIGHT        KEY_KPRIGHTPAREN
#define VK_BTN_UP           KEY_KPPLUS
#define VK_BTN_DOWN         KEY_KPMINUS

#define VK_MOD_CTRL         1
#define VK_MOD_SHIFT        1
#define VK_MOD_ALT          1

// don't change this unless a new scancode has been found
#define VEIKK_BTN_COUNT     13

// 1 for default mode, 0 for regular mode
#define VEIKK_DFL_BTNS      0
```

## Manual fun

The thing about all of the above methods is that they all attempt to make keyboard mapping easy to configure and flexible, while making some concessions to improbably use cases and unnecessary overdesigning, for the sake of simplicity and not involving a dozen mismatched tools to do a simple thing (and might explode later). The funny thing is that I went around in a huge circle, discovering a good range of X tools and realizing one-by-one that they were not meant to do what I originally had hoped they could, and eventually came to a pretty normal and unexciting solution (sending long key combinations and hoping for no collisions). But if I had a very specific use case in mind, and with the knowledge of the above tools in mind, it should be fairly easy to whip up a usable configuration. This *journey* was a good way to familiarize myself with a set of tools and what their intended use cases are for future reference: e.g., `xbindkeys` is for a pretty straightforward keycode-to-command mapping, xkb is for creating new keyboard layouts, `xinput set-button-map` is for remapping mouse buttons, `uinput` can be used for custom scripting solutions for virtual events on the fly, etc.

But it shouldn't be hard to see that the easiest combination for the super user would be to manually turn scancodes into specific keys or key combinations in the driver. Rather than map scancodes to some generic key combination like <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>Keypad 0</kbd>, which you might then bind to a different key combination with `xbindkeys`, directly bind the scancode to the desired combination, be it <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd> or whatnot. In other words, the <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>Keypad 0</kbd> key combination acts as a proxy, which is useful for generic keymapping since it is unlikely to conflict with existing key combinations, but we can be more direct and cut out the proxy if we know exactly what we want our buttons to map to. This way, you don't need to mess with all of the userspace tools that are intended to generify the process to the average user. This directly solves Major Design Challenges #2, #3, and #4. (#3 is avoided since you never have to remap any keys in userspace; #2 and #4 are avoided because no proxy keycode is ever involved, so no collisions between the proxy keycode and an existing keycode)

This also be used to easily bypass Major Design Challenge #1: if you want to set different key maps for different devices, hardcode in different key maps for different devices. Easy as that.

However, you still need some "proxy" keycode if you want to run some executable file on button press (i.e., with `xbindkeys`), but even then the process can be simpler. If you know what keycodes you'll never use, you can use those as your proxy and avoid using the modifier keys (and thus avoiding Major Design Challenges #2 and #4). (For example, you might use <kbd>KEY_COFFEE</kbd> (keycode 160 in X) as a proxy if you never use that key otherwise.) You can then bind <kbd>KEY_COFFEE</kbd> to your favorite (e.g., `git clone https://www.github.com/torvalds/linux`) without worrying about a "collision." And then go have some real coffee, because that clone's going to take a while.



[first-blog-post]: http://everything-is-sheep.herokuapp.com/posts/on-developing-a-linux-driver
[second-blog-post]: http://everything-is-sheep.herokuapp.com/posts/veikk-linux-driver-v3-notes
[github]: https://www.github.com/jlam55555/veikk-linux-driver
[xmodmap-bug]: https://bugs.launchpad.net/ubuntu/+source/linux/+bug/998310
[xinput]:https://linux.die.net/man/1/xinput
[xdotool]:http://manpages.ubuntu.com/manpages/trusty/man1/xdotool.1.html
[xev]:https://linux.die.net/man/1/xev
[xbindkeys]:https://linux.die.net/man/1/xbindkeys
[xmodmap]:https://linux.die.net/man/1/xmodmap
[xte]:https://linux.die.net/man/1/xte
[xvkbd]:http://xahlee.info/linux/linux_xvkbd_tutorial.html
[xkb]:https://www.x.org/wiki/XKB/
[guide-to-xkb]:https://medium.com/@damko/a-simple-humble-but-comprehensive-guide-to-xkb-for-linux-6f1ad5e13450
[ubuntu-wayland]:https://www.omgubuntu.co.uk/2018/01/xorg-will-default-display-server-ubuntu-18-04-lts
[uinput-example]:https://unix.stackexchange.com/a/508743/307410
[uinput-mapper]:https://github.com/MerlijnWajer/uinput-mapper
[remapping-mouse-buttons]:https://askubuntu.com/a/492745/433872
[xkb-1]:https://superuser.com/a/869064/243079
[xkb-2]:https://unix.stackexchange.com/a/536022/307410
[mechanism-policy]:https://en.wikipedia.org/wiki/Separation_of_mechanism_and_policy

