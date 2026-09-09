import { readFile, writeFile } from "node:fs/promises";

const delegatePath = "ios/App/App/SceneDelegate.swift";
let source = await readFile(delegatePath, "utf8");

if (source.includes("scrollView.bounces = false")) {
  console.log("TripSpend iOS viewport patch already applied.");
  process.exit(0);
}

const classNeedle = `class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
`;
const classReplacement = `class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private var appBackgroundColor: UIColor {
        UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.043, green: 0.063, blue: 0.094, alpha: 1)
                : UIColor(red: 0.957, green: 0.965, blue: 0.980, alpha: 1)
        }
    }
`;

const windowNeedle = `        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()
`;
const windowReplacement = `        let bridgeViewController = CAPBridgeViewController()
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = appBackgroundColor
        bridgeViewController.view.backgroundColor = appBackgroundColor
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()

        // Match the native canvas behind the web app and prevent WebKit bounce
        // from pulling that canvas into view above or below the page.
        DispatchQueue.main.async { [weak self, weak bridgeViewController] in
            guard let self, let bridgeViewController else { return }
            let background = self.appBackgroundColor
            bridgeViewController.webView?.isOpaque = false
            bridgeViewController.webView?.backgroundColor = background
            bridgeViewController.webView?.scrollView.backgroundColor = background
            bridgeViewController.webView?.scrollView.bounces = false
            bridgeViewController.webView?.scrollView.alwaysBounceVertical = false
        }
`;

if (!source.includes(classNeedle) || !source.includes(windowNeedle)) {
  throw new Error("Unsupported Capacitor SceneDelegate template; iOS viewport patch was not applied.");
}

source = source.replace(classNeedle, classReplacement).replace(windowNeedle, windowReplacement);
await writeFile(delegatePath, source);
console.log("TripSpend iOS viewport patch applied.");
