import Cocoa
import WebKit

class ConsoleLogger: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        print("[JS LOG]", message.body)
        fflush(stdout)
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var logger: ConsoleLogger!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Configure WebKit
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let userContent = WKUserContentController()
        logger = ConsoleLogger()
        userContent.add(logger, name: "nativeLog")
        let jsBridge = """
        (function() {
            window.onerror = function(msg, url, line, col, error) {
                window.webkit.messageHandlers.nativeLog.postMessage("WINDOW ERROR: " + msg + " at line " + line + ":" + col + " stack: " + (error ? error.stack : ''));
            };
            const origLog = console.log;
            console.log = function(...args) {
                origLog.apply(console, args);
                try { window.webkit.messageHandlers.nativeLog.postMessage("LOG: " + args.join(' ')); } catch(e){}
            };
            const origErr = console.error;
            console.error = function(...args) {
                origErr.apply(console, args);
                try { window.webkit.messageHandlers.nativeLog.postMessage("ERROR: " + args.join(' ')); } catch(e){}
            };
            const origWarn = console.warn;
            console.warn = function(...args) {
                origWarn.apply(console, args);
                try { window.webkit.messageHandlers.nativeLog.postMessage("WARN: " + args.join(' ')); } catch(e){}
            };
        })();
        """
        let userScript = WKUserScript(source: jsBridge, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        userContent.addUserScript(userScript)
        config.userContentController = userContent

        let screenSize = NSScreen.main?.visibleFrame.size ?? CGSize(width: 1280, height: 800)
        let winWidth = min(1280.0, screenSize.width * 0.9)
        let winHeight = min(800.0, screenSize.height * 0.9)

        let rect = NSRect(x: (screenSize.width - winWidth) / 2,
                          y: (screenSize.height - winHeight) / 2,
                          width: winWidth,
                          height: winHeight)

        let styleMask: NSWindow.StyleMask = [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView]

        window = NSWindow(contentRect: rect, styleMask: styleMask, backing: .buffered, defer: false)
        window.title = "Michelle De Santa 3D — The Syndicate of Loyalty"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = false
        window.backgroundColor = NSColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 1.0)
        window.delegate = self
        window.minSize = NSSize(width: 800, height: 600)
        window.collectionBehavior = [.fullScreenPrimary]

        webView = WKWebView(frame: rect, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")

        window.contentView = webView

        // Load index.html from bundle resources or local directory
        var htmlURL: URL? = nil
        if let resURL = Bundle.main.resourceURL {
            let candidate = resURL.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: candidate.path) {
                htmlURL = candidate
            }
        }
        if htmlURL == nil {
            let localCandidate = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: localCandidate.path) {
                htmlURL = localCandidate
            }
        }

        if let target = htmlURL {
            webView.loadFileURL(target, allowingReadAccessTo: target.deletingLastPathComponent())
        }

        setupMenuBar()

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func setupMenuBar() {
        let mainMenu = NSMenu()

        // App Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Michelle De Santa 3D", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Michelle De Santa", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit Michelle De Santa", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // View Menu
        let viewMenuItem = NSMenuItem()
        let viewMenu = NSMenu(title: "View")
        viewMenu.addItem(withTitle: "Toggle Full Screen", action: #selector(toggleFullScreen), keyEquivalent: "f")
        let reloadItem = NSMenuItem(title: "Reload", action: #selector(reloadGame), keyEquivalent: "r")
        reloadItem.keyEquivalentModifierMask = [.command]
        viewMenu.addItem(reloadItem)
        viewMenuItem.submenu = viewMenu
        mainMenu.addItem(viewMenuItem)

        NSApp.mainMenu = mainMenu
    }

    @objc func showAbout() {
        let alert = NSAlert()
        alert.messageText = "Michelle De Santa 3D"
        alert.informativeText = "Reliable Friend • Calm & Serious • Loyal Companion\nCreated for macOS & Android.\n\nFeaturing 3D Noir Santa District, V8 Roadster, and Story Missions based on the legendary presentation."
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Continue")
        alert.runModal()
    }

    @objc func toggleFullScreen() {
        window.toggleFullScreen(nil)
    }

    @objc func reloadGame() {
        webView.reload()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
