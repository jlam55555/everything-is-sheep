Follow-up to the [second blog post][second-blog-post] on the [Linux driver for VEIKK digitizers][github], which focused on the driver updates in v1.1 through v3-alpha. (That was in turn an update from the [first blog post][first-blog-post], which detailed v1 of the driver) After messing around with mapping in userland (and it turning out to be not as simple as expected, as these things tend to go), I've decided to separate this into its own blog post. This one is more of a brain dump than anything, because the whole process was a sh*tshow and that'll be the overall theme of this text. Most likely it's because it's my first venture into X-land, but I'm not sure.

Like the last post, this will be a live document until v3 becomes stable.

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

### 4. Not overlapping with common keys or key combinations

This is probably the most general concern, and the earliest one. How do we make sure that we don't create some mechanism that could interfere with existing keyboard shortcuts or keys? E.g., how do we know that pressing one of the VEIKK buttons doesn't coincide with another keyboard shortcut? This is similar to Major Design Challenge #2, but is not limited to modifiers.

Since this design challenge is so broad, it is inevitable that some collisions with other keyboard shortcuts might happen, no matter what scheme you use. So this required some compromise that is mostly solved by allowing some flexibility in the keyboard mapping scheme.

## X keyboard ecosystem

There's a large ecosystem of the X tools. Unfortunately, without any formal knowledge of the X system (or the patience to read the X specification), this is only a very sparse reference based on some web searches. These are the tools that I've found most relevant to this work. This section indirectly goes over all of the methods that I tried and problems with those methods; these will be summarized in the following section.

### [`xinput`][xinput]

This has already come across in some of the blog posts, and it's fairly important. This command can list pointer and keyboard devices available to X (`xinput list`), view and modify specific X devices, view events coming from devices (with `xinput test`), and interact with the X drivers (like evdev or libinput).

This is different from `evtest` because it's not what the input subsystem receives from the driver, but rather what X sees. The two may not correspond; e.g., X keycodes are shifted eight higher than evtest keycodes (e.g., `KEY_A` is 30 to the driver and to `evtest`, but `xinput test` reads it as 38). X keycodes max out at 255 due to the historical fact that keycodes were limited to one byte. X also handles buttons and keycodes separately; the "buttons" `BTN_0` through `BTN_2` and `BTN_3` through `BTN_9` correspond to X's buttons 1 through 3, and buttons 8 through 14, respectively.

These buttons are treated as mouse buttons and are easily remapped through libinput or evdev (using `xinput set-button-map`); however, there are not enough of them to remap all of the keys. X seems to limit us to 10 buttons, even though there are up to 12 remappable keys on a VEIKK tablet (e.g., on the A50). While I'm sure I could have attempted to circumvent this somehow (e.g., with modifiers), I think things would end up being a sh*tshow pretty quickly. Plus, it breaks the semantics of the buttons being mouse buttons, which I'm strongly against; also, the break between `BTN_3` and `BTN_4`'s mappings is nonintuitive and may cause extra confusion.

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

### Other mapping tools

**TODO: working here**

## Mapping models/attempts
Now that you've seen some of the tools I encountered along the way, here'll be a rundown of some of the ideas I attempted to achieve (and the many failures that came with them). The general trend is that they went from more idealistic to more realistic.

### 1. `xinput set-button-map`

### 2. `xbindkeys` (by itself)

### 3. xkb (by itself)

### 4. xkb+`xbindkeys`+`xmodmap`

### 5. kernel-space mapping

This was the original idea: send keyboard mapping configurations to the driver, which would report the keyboard combinations directly.

This quickly became a less-unappealing solution over time as user-space mapping seemed more and more tiring, but it still has the same caveats as before:

- policy should not really be implemented in the kernel (I break this rule a little bit with the "default mode" vs "regular mode" mappings in the driver, but I think it is useful to allow this to be adjusted by the user on the fly as a sysfs parameter)
- the format would be very abstruse and proprietary, which is not intuitive to tinkerers (who are very welcome to tinker)
- probably could not offer as rich or reliable of a customization interface as user-space tools provide
- would be hard to specify model-specific parameters, never mind device-specific parameters

### 6. uinput+udev

This is similar to the original solution used to get pressure sensitivity working for VEIKK tablets, as [suggested by tobiasBora][uinput-example]. (Theoretically, since `hid-generic` already forwards the events from the VEIKK tablet to X, but is not in the correct format, all of this VEIKK driver's functionality could have been implemented in userspace using a mapping daemon. But that has already been discussed in the previous blog articles.)

**TODO: describe the solution here**

While this would be the most flexible solution, solving most of the Major Design Challenges, I decided not to do this because:

- requires the most code on our part, which means most moving parts and large chance of failure
- by this point, I had already begun doubting the realistic benefit of solving Major Design Challenge #1 and #2
- there might be some inconsistency between udev and X (e.g., does X latch onto the device first or would my script?)
- it requires running some sort of daemon in the background, which I would prefer not to do (would prefer to use X.org's existing server, or at least a more general existing daemon like `xbindkeys` ); not writing a daemon means having to worry a lot less about the intricacies of a continuously-running script and keeps the configuration serverless (while relying on underlying X tools as servers).

The last two also are reasons why a userspace "driver" with uinput+udev is less desirable than a kernel driver.

### 7. Using custom mapping tools

Looking at the implementation of third-party mapping tools, most of them seem to use some implementation of uinput+udev(+ usually Python). While this is basically identical to Mapping Model/Attempt #5, it does offload some of the intricacies of uinput+udev, at the cost of not being specific to VEIKK devices and requiring the installation of extra dependencies or libraries.

### 8. Custom keycodes with modifiers

This method essentially gave in to both Major Design Challenges #1 and #2.

## Manual fun

The thing about all of the above methods is that they all attempt to make keyboard mapping easy to configure and flexible, while making some concessions to improbably use cases and unnecessary overdesigning, for the sake of simplicity and not involving a dozen mismatched tools to do a simple thing (and might explode later). But if I had a very specific use case in mind, and with the knowledge of the above tools in mind, it should be fairly easy to whip up a usable configuration.

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