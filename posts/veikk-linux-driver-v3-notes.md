(This is a live document, since v3 is still in alpha)

This can be thought of as the sequel to [On Developing a Linux Driver][eis-blog-post]. There is also [Button Mapping Journeys][next-blog-post], which is specifically about user-space mapping for the buttons using the X ecosystem of tools in version 3 of the driver.

## What is v3? (Or v2, or v1, for that matter?)
*[You don't have to read this part if you're looking to help develop/test this driver, but it may provide some useful background on some of the challenges and rationale behind some actions.]*

I didn't have hope for any pressure sensitivity on Linux for about a year after my sister obtained an S640 circa 2018.

About a year later I stumbled across [@tobiasBora's self-answered question on Unix & Linux Stack Exchange][unix-stack-exchange] where he was able to use Python and [uinput][uinput] to map raw events coming from the tablet to a virtual tablet device (all done in userspace). This works because the tablet still sends ordinary data packets following the HID specification to the computer, but the format of the events are such that the OS and display systems (i.e., the X server, which manages HID devices) doesn't recognize the emitted events as that of a tablet. This is not a bad solution, as it is quick and gets the job done.

### v1.0: Pressure sensitivity
@tobiasBora's post inspired me to try to create a driver that did the same thing. At the time I didn't really understand what a driver really was or what it did, but I thought that it would be more "native." (After all, this is all the driver is really doing as well: but rather than mapping events from evdev devices in the `/dev` pseudo filesystem to a `uinput` virtual device as the Python script does, the driver maps raw HID report packets to evdev devices (i.e., the [input subsystem of linux][input-subsystem]). So by writing the driver, we don't add an additional layer to the event processing "tech stack," but modify an existing one instead.) So I set out to try to create a Linux driver. I won't restate the process of writing the first version -- my thought process is documented in [this blog post][eis-blog-post].

### v1.1: Basic configuration
This was a weak attempt at allowing configuration parameters through a simple bash CLI and using [sysfs parameters][sysfs-parms]. This offered basic pressure mapping (through some predefined functions) and orientation mapping. The driver was not written well to accommodate this, and the CLI was not all that advanced, so it wasn't all that great.

### v2.0: More configuration
I rewrote the driver from scratch in the spirit of making this highly configurable for devices other than the S640. At the time, I didn't have any other devices, so I tried to accommodate for this by allowing for custom callbacks for input registration and configuration. First of all, the app was modularized into three files (four including the header file): the core driver (`veikk_drv.c`), device-specific callbacks (`veikk_vdev.c`), and configuration callbacks (`veikk_modparms.c`).  The main addition was that of `veikk_modparms.c`, which allowed for pressure mapping (via an arbitrary cubic function), screen mapping (via an arbitrary linear transformation) and custom orientation. However, the core driver and input registration logic was refactored but mostly left the same, leaving in some of the VEIKK quirks. (As a result, if no special configuration was set, this version performed almost the same actions as v1.)

The main achievement about this was the space-optimization used for the sysfs parameters. Sysfs parameters can either be a primitive type up to 64 bits (i.e., it can be of type `byte`, `short`, `ushort`, `int`, `uint`, `long`, `ulong`, `charp`, `bool`, `invbool`; see [`linux/moduleparam.h`][moduleparam.h]), or an array of any of those values. Interestingly (and what made my life a lot harder) was that only the primitive (non-array) module parameters had on-change callbacks, which were more-or-less essential for me (in order to update the configuration on the `struct input_dev` when any configuration was changed). Also, in order to prevent issues with potentially-invalid configurations, all configuration options had to fit within a single module parameter. This meant that I somehow had to cram a cubic function (for the pressure mapping) and a set of coordinates (for the screen mapping) into a `u64`, which (long story short) ended up with a lot of confusing, poorly-documented compromises. On top of this, the pressure mapping calculation had to be done entirely [without floating-point numbers][no-fp], which is also undesirable (although I'm not sure if this realistically would cause any problems with "pressure precision").

After I was able to cram all of the configuration into four sysfs parameters (`pressure_map`, `orientation`, `screen_map`, and `screen_size`), writing the configuration tool was pretty straightforward: its purpose was only to write the appropriate values to the sysfs parameters, which did the hard work of mapping the input. The hard part of this step turned out to be learning Qt and some of its integrations with X -- most notably, I wasn't able to figure out how to display multi-monitor configurations for the "screen-mapping interactive thumbnail," which made screen mapping hard.

(... One year hiatus because of school. At this time, I took an elementary *nix OS class, and learned a lot of the basics about operating systems. VEIKK was also kind enough to send me a VK1560 and an A50 for testing, which have been very helpful ...)

### v3-alpha (current): userspace configuration and fixing quirks

#### Fixing the mapping problem
While v2 was nice because it allowed for configuration, it made things very messy. This made a number of problems, such as:

- There were so many compromises needed to squash all of the configuration parameters into neat `u64` boxes for sysfs. These may not all have been well-documented, and the general non-transparency of it all may open the door for bugs.
- The current module-parameter situation is not a good fit for buttons; there are so many buttons (12 buttons or "button-like hardware events" for the A50), each of which could be mapped to one-or-many virtual button events. No way this could fit in a `u64`. Perhaps it could work with a sysfs array, but that is still inconvenient and not terribly transparent to the user. Thus there was no button support yet.

I recently started reading [*Linux Device Drivers, 3rd edition*][ldd3], which, while 15 years old (the book is "current as of the 2.6.10 kernel," according the website), still seems to be the de facto book on writing drivers for Linux. It made it clear in Chapter 1 that the role of the device driver is to provide a consistent interface of a hardware device to the OS, to provide the "mechanism" and leave "policy" details up to the user. In this case, "policy" would be the configuration parameters, etc., and is usually best left up to userspace tools. In other words, the drivers in the kernel are meant to make devices "just work," and shouldn't force any sort of configuration tools or clients on the user.

This brings us back round to @tobiasBora's comment and tools like uinput. It would be so much easier to map everything from a userspace program like his than to jump through all the hoops in the kernel. My initial thought was to use create a virtual device with uinput that reported the mapped outputs, just like @tobiasBora's Python tool. It would then have to blacklist the veikk driver from X server (e.g., in `/etc/X11/xorg.conf.d/`) so that the original, unmapped device wouldn't affect the cursor. It would also need to be running as some kind of service (at which point I looked at [systemd services][systemd-services]) and be notified when a new VEIKK device is added or removed (at which point I considered [udev][udev]). Eventually this seemed like jumping even more hoops.

More recently, I found out that the X server already has built-in mapping tools, both for keyboard mapping and for tablet screen and pressure mapping. These tools are:

- [xkb][xkb]: Remap keys
- [xbindkeys][xbindkeys]: Bind keys to executing specific scripts (not as important as working with xkb, but also a cool function)
- [libinput][libinput] and evdev X drivers: Digitizer mappings (also button remapping, but less convenient than xkb)

The advantage to using these tools is that they're well-established tools for X, and thus we don't need any additional mapping layers and tools that may introduce additional bugs.

The VEIKK devices emit some default HID usages for common drawing device keys and key combinations (the A50 and VK1560 emit <kbd>F5</kbd>, <kbd>I</kbd>, <kbd>Space</kbd>, <kbd>V</kbd>, <kbd>Ctrl</kbd>+<kbd>C</kbd>, <kbd>Ctrl</kbd>+<kbd>V</kbd>, <kbd>Ctrl</kbd>+<kbd>Z</kbd>, <kbd>Ctrl</kbd>+<kbd>S</kbd>, <kbd>+</kbd>, <kbd>-</kbd>, <kbd>[</kbd>, <kbd>]</kbd>, and <kbd>Enter</kbd>). However, sending multiple keys to X for a keypress (e.g., mapping <kbd>Ctrl</kbd>+<kbd>C</kbd> to <kbd>B</kbd> will not be easy) will make mapping hard, so the driver will do the simple mapping of each of the keys to a single button code: <kbd>BTN0</kbd>, <kbd>BTN1</kbd>, etc. The directional keys <kbd>+</kbd>, <kbd>-</kbd>, <kbd>[</kbd>, and <kbd>]</kbd> will be remapped to arrow keys <kbd>Up</kbd>, <kbd>Down</kbd>, <kbd>Left</kbd>, and <kbd>Right</kbd>. These single button codes will be easy to remap from xkb.

However, in case the user doesn't install a special key mapping, the default fallback key mapping can be toggled using a sysfs parameter. I.e., if this switch is toggled, then the tablet will report the default <kbd>F5</kbd>, <kbd>I</kbd>, etc. to X, so that no remapping is necessary.

You can see [this blog post][next-blog-post] for an explanation of button mapping in user space, since it wasn't nearly as simple as originally imagined.

#### Fixing VEIKK quirks
In addition, v2 was not all that fundamentally different from v1, and didn't fix some underlying bugs that were there from the start, mostly related to the device quirks:

- I didn't know what [the three USB interfaces][three-usb-interfaces] that the physical VEIKK device was reporting to the OS were, or what their report descriptors meant.
- The driver doesn't always work on older systems (most notably Ubuntu 14.04, which is [not EOL until April 2022][ubuntu-releases]).

Each VEIKK device (as tested so far) has three internal USB interfaces. Each of these gets probed separately and gets a separate `struct hid_device` (i.e., `veikk_probe` gets called on each one of them).

A brief overview of report descriptors, for the unaware: These can be seen with `usbhid-dump -d 2feb` (`0x2feb` is VEIKK's vendor ID). Each of these interfaces has a HID "report descriptor" associated with them that describes their purpose. (Here is a [nice tool for interpreting the output of `usbhid-dump`][hid-report-parser] and a [nice tutorial about them][hid-report-tutorial].) Each report descriptor has a hierarchical list of collections (for grouping usages, fields, and subcollections), usages (describing purpose of a collection or field), and fields (describing the format of an input report) that describes the format of data sent from the device to the computer, and how that data will be used.

One internal interface of each VEIKK device is a proprietary interface that doesn't emit any events. For our purposes, we can ignore this completely.

And then the other two USB interfaces have the pen and the keyboard. In the report descriptors, there is always a "Digitizer" usage, a "Mouse" usage, and a "Keyboard" usage -- even for the S640 which doesn't have a keyboard. This is mostly fine, except that **sometimes the digitizer and keyboard usages, or the digitizer and mouse usages, are grouped into the same internal interface**. Usually, an USB interface is supposed to be one logical group of functions, so this makes things super confusing.

Here's what I've gathered from `usbhid-dump` and testing. This shows both the grouping of HID usages under different USB interfaces, as well as the usages that are emitting certain events (marked with an asterisk). 

| Model                                              | USB Interface 1   | USB Interface 2         | USB Interface 3   |
| -------------------------------------------------- | ----------------- | ----------------------- | ----------------- |
| S640                                               | Digitizer, Mouse* | Keyboard (unused)       | VEIKK proprietary |
| A50 (mine matches [@nbogie's comment][a50-report]) | Digitizer, Mouse* | Keyboard*               | VEIKK proprietary |
| A15 (from [@LinkJ's comment][a15-report])          | Mouse*            | Digitizer, Keyboard*    | VEIKK proprietary |
| VK1560                                             | Mouse             | Digitizer\*, Keyboard\* | VEIKK proprietary |

The fact that every device that I have a dump for is different is a little scary, but not unsurmountable. Each device has one proprietary interface, one mouse HID device, and one keyboard HID device (save for the S640). The interface with the keyboard always emits the keyboard events, but the pen events can come from either the mouse or digitizer usages from either interface, depending on the device. With the HID driver, we have to register input devices with a certain `struct hid_device`, so this is what the driver does:

- Finds the proprietary VEIKK USB interface, and ignores it.
- Finds the VEIKK USB interface with the keyboard, and registers an input with it. Then keyboard events are registered on this input.
- Finds the other VEIKK USB interface (the "pen" interface), and registers an input with it. Then digitizer events are registered on this input.

Thus two input devices (except for the S640) registered to X: a keyboard input device, and a pen input device. And while the keyboard input device registers digitizer events, it will only emit keyboard events, and the pen input device will only emit digitizer events. This works better with some programs (e.g., see the "Other things to note: Older versions of Krita...") and overall makes the presentation to X much cleaner and more intuitive. In other words, with this driver, X sees:

- 1 pen input that emits pen events
- 1 keyboard input that emits keyboard events

And that's how things should be.

(Note: doing this doesn't completely work in Linux 4.4 with Ubuntu 14.04, and I'm not completely sure why. It seems that there might be some relationship between the report descriptors that an HID device sends and what events you can register with the associated `struct input_dev`. Or maybe not. I tried fiddling around with report descriptors and a bunch of other features, getting some very erratic results. But manually upgrading the kernel to a mainline 4.18 kernel fixed those issues (and is consistent with Linux 5.6), and thus I'm not planning to officially/fully support kernels older than 4.18.)

This is as opposed to before in versions v1 through v2, in which pen inputs were registered on all of the HID devices, even though there was only one pen input. So this created the (highly illogical) presentation to X:

- 2 pen inputs that emits no events (proprietary and keyboard interfaces)
- 1 pen input that emits pen events

Another slightly-related thing to mention is that the proprietary device seems to have some issues with the parsing of its report descriptor, causing a timeout in Ubuntu 14.04. While this didn't break anything, it caused probe times to be slow. By ignoring the proprietary device very early on in the probe function, this problem was eliminated.

#### Style Changes

v1 through v2 were written while I was still in a JavaScript-style mind. After reading more kernel code (and the hilarious [kernel style guide][kernel-style-guide]), I decided that I should follow that convention. While it's not there yet in the current alpha phase, I'm aiming to shift the code closer to the kernel recommendations.

Also, the code has been moved into one file. Without all of the configuration functions like in v2, the driver has been much simplified, and doesn't need so many files. It is also not that long (currently ~500 lines).

## Testing environments
Here's the results from personal testing. Due to differences in the kernel's input subsystem behavior in kernels 4.4 and kernels, only kernels 4.18+ will be supported.

Operating systems / Kernels versions / Software:

- (**NOT OFFICIALLY SUPPORTED**) Ubuntu 14.04 / 4.4.0 / Krita 2.9.11 (through Lime PPA), GIMP 2.8.10
    - Notes: somewhat working: cannot report regular keyboard buttons from the keyboard (but button events work fine if a certain additional keycode is specified; see bugs below). Krita 2.8 (from default package repositories) didn't appear to work completely well, but I didn't test it for very long before upgrading to the 2.9 Lime PPA version.
- Ubuntu 14.04 / *mainline 4.18.0* / Krita 2.9.11 (through Lime PPA, GIMP 2.8.10)
    - Notes: same computer and setup as above, but manually compiled and installed mainline Linux 4.18.0 kernel from source (from kernel.org archives). Things do work as expected, but this may not be for the faint of heart. (But actually, manually upgrading the kernel is a fun and rewarding experience, if you decide to do this.)
- Ubuntu 18.04 / 5.4.0 / Krita 4.0.1
    - Working as expected
- Arch Linux / 5.6.15 / Krita 4.2.9, GIMP 2.10
    - Working as expected

## Bugs and workarounds

The following are the bugs associated with this driver. I'll try to list the affected testing environment as well. Please contact me by email or open an issue if you encounter any of these bugs.

(No bugs from versions other than 14.04 have been reported.)

### Bugs with Ubuntu 14.04, Linux kernel 4.4 (unsupported)

I'm listing these here because I spent a fair amount of time (and frustration) trying to get things to work with Ubuntu 14.04. 

- Sometimes the pen input or the keyboard input (or both) for the A50 were not reporting any events when plugged in on Ubuntu 14.04 with kernel 4.4. It seemed very random and I could not find a way to reliably reproduce it. For example, sometimes just reloading the module without any changes (e.g., something like `modprobe -r veikk && modprobe veikk` or `make uninstall install` caused it to switch from working to not-working or vice versa). Recently it has not been an issue. This hasn't occurred on either the S640 or the VK1560.
    
    - Testing environment: Ubuntu 14.04, kernel 4.4, A50
    
- I was getting *very strange* issues with registering devices. In particular, if I tried to register certain keycodes on the `struct input_dev`s (i.e., the events you see when you run `evtest`), the device wouldn't report any events at all. In particular, if I didn't register digitizer events on the keyboard *or* if I didn't register any key event higher than keycode with event 352 (<kbd>KEY_OK</kbd>), then the buttons wouldn't report any events. But doing one or the other of these fixed the issue. Also, if I attempted to register any keyboard events with keycodes less than event 256 (<kbd>BTN_0</kbd>), no events would register. The former is okay because I found the workaround; the latter was kind of unbearable because while I could report keys like <kbd>BTN_0</kbd>, I can't report normal keys like <kbd>Ctrl</kbd> and <kbd>C</kbd> (i.e., the default keymap), thus not allowing the default keymap (which was discussed earlier in "Fixing the mapping problem") and forcing the user to use a mapping solution like xkb. The strange thing is that the `hid-generic` driver does successfully register and report these normal keys, which means that it's definitely not impossible; but I spent too many hours of my time slaving over this and trying to trace stack dumps and function calls and scanning the [v4.4 Elixir Bootlin HID sections and headers][v44-elixir-bootlin] and generally ripping my brains out. It's not worth it for me.

    I tried manually upgrading the Ubuntu 14.04 kernel from 4.4 to 4.18, a version which I've known works, and sure enough, it fixed the issue. So, for now I'm not officially supporting kernel 4.4, even though I spent a long time testing on it and designing this driver to work for it; 4.18 has been around for two years, and I hope that enough users are using it or can upgrade their kernel version to it. I also believe that 4.15 (default for Ubuntu 16.04) works with the exception of the `hid-generic` stealing (see below section), and I'm not sure what the earliest kernel that this driver will work with is; I hope that this supports enough of the users that might want to use this driver. I hate that I don't know what the issue is, and I can rant about this for another few thousand words. But enough is enough.

## Other things to note
This section will list some of the strange things that have been noticed during testing. These are not bugs, but rather "just how the system works" -- i.e., most of them have to do with the way X or Krita or GIMP work, and are likely design decisions that are far beyond my misunderstanding. But while they are not bugs, they are still things to be aware of when testing/using. Do not open a new issue for these, unless the workaround is not documented.

- If possible, use the libinput driver for X (xf86-input-libinput) rather than the evdev driver. (libinput is the newer and better of the two, and is based on evdev.) On Arch Linux with kernel 5.6, the evdev driver didn't register the device and its configuration properties properly, but libinput did. However, on Ubuntu 14.04 (kernel 4.4), there is no libinput driver, and the evdev driver registered the events successfully.
    - Solution: Make sure xf86-input-libinput is installed. If xf86-input-evdev is also installed, then go to `/usr/share/X11/xorg.conf.d/`, and make sure that the libinput file comes before the evdev file alphabetically. Restart the X server (log out/log back in).
- Some versions of GIMP and Krita don't seem to recognize pressure sensitivity if a device is plugged in while the program is running.
    - Solution: Try restarting GIMP and Krita after plugging in a device.
- In GIMP, make sure to go to Edit > Input Devices, and enable the correct tablet pen to get pressure sensitivity to work.
    - Solution: If the device doesn't show up in this menu, restart GIMP first. (See previous bullet point.)
- After reloading the module (i.e., with `make install`), the VEIKK devices don't register any events until you replug in the device.
    - Solution: Unplug and replug the VEIKK tablet.
- On Linux kernels < 4.18, the `hid-generic` will steal the VEIKK device first, not the `veikk` driver. This only seems to happen if the driver was recently installed; rebooting the system (as long as the module is configured to load at boot using `/etc/modules-load.`) appears to fix this issue. This problem has been known, and its solution has been documented in the below link. (I might write a script/config file to blacklist VEIKK devices from `hid-generic`, but this is not a priority for me.)
    - Solution: See [this issue][hid-generic-stealing-device]. Or just reboot your system.
- Older versions of Krita (i.e., when testing on Ubuntu 14.04, with Krita 2.9.11) don't recognize the pen if it registers keyboard events as well. Since the VK1560 has emits pen events from an interface that has both a pen and keyboard events, Krita doesn't recognize these pen events with the hid-generic driver. This is something that the VEIKK driver fixes.
    - (No action needed -- this driver fixes this issue.)

[unix-stack-exchange]: https://unix.stackexchange.com/a/508743
[uinput]: https://www.kernel.org/doc/html/v4.12/input/uinput.html
[input-subsystem]: https://www.kernel.org/doc/html/latest/input/input_uapi.html
[ubuntu-quirks]: https://wiki.ubuntu.com/X/Quirks
[eis-blog-post]: https://everything-is-sheep.herokuapp.com/posts/on-developing-a-linux-driver
[sysfs-parms]: https://lwn.net/Articles/85443/
[moduleparam.h]: https://elixir.bootlin.com/linux/latest/source/include/linux/moduleparam.h#L101
[no-fp]: https://stackoverflow.com/a/13886805
[three-usb-interfaces]: https://github.com/jlam55555/veikk-linux-driver/issues/14
[ubuntu-releases]: https://wiki.ubuntu.com/Releases
[ldd3]: https://lwn.net/Kernel/LDD3/
[systemd-services]: https://www.freedesktop.org/software/systemd/man/systemd.service.html
[udev]: https://opensource.com/article/18/11/udev
[xbindkeys]: https://wiki.archlinux.org/index.php/Xbindkeys
[xkb]: https://wiki.archlinux.org/index.php/X_keyboard_extension
[libinput]: https://wiki.archlinux.org/index.php/libinput
[hid-report-parser]: https://eleccelerator.com/usbdescreqparser/
[hid-report-tutorial]: https://eleccelerator.com/tutorial-about-usb-hid-report-descriptors/
[a50-report]: https://github.com/jlam55555/veikk-linux-driver/issues/4#issuecomment-581004043
[a15-report]: https://github.com/jlam55555/veikk-linux-driver/issues/14#issuecomment-580415066
[kernel-style-guide]: https://www.kernel.org/doc/html/latest/process/coding-style.html
[v44-elixir-bootlin]: https://elixir.bootlin.com/linux/v4.4/source/drivers/hid
[hid-generic-stealing-device]: https://github.com/jlam55555/veikk-linux-driver/issues/2

[next-blog-post]:http://everything-is-sheep.herokuapp.com/posts/button-mapping-journeys