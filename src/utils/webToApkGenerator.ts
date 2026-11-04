import JSZip from "jszip";

export interface WebToApkConfig {
  url: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  orientation: "portrait" | "landscape" | "sensor";
  
  // Theming & Window
  statusBarColor: string;
  navBarColor: string;
  statusBarStyle: "light_icons" | "dark_icons";
  enableFullscreen: boolean;

  // Splash Screen Options
  enableSplash: boolean;
  splashDurationMs: number;
  splashBgColor: string;
  splashTitle: string;
  splashSubtitle: string;
  splashIcon: "globe" | "shield" | "rocket" | "smartphone" | "store" | "code" | "terminal";
  splashAnimation: "fade" | "zoom" | "slide" | "pulse";

  // App Icon Options
  iconSymbol: "globe" | "shield" | "rocket" | "smartphone" | "code" | "store" | "bolt" | "terminal";
  iconBgColor: string;
  iconShape: "squircle" | "circle" | "rounded";
  customIconUrl?: string;

  // WebView Capabilities
  enableCache: boolean;
  enableSwipeRefresh: boolean;
  enableCamera: boolean;
  enableGeolocation: boolean;
  enableFileUploads: boolean;
  enableZoom: boolean;
  userAgentMode: "default" | "desktop" | "custom";
  customUserAgent?: string;
  externalLinkHandling: "in_app" | "browser" | "whitelist";
  allowedDomains: string;

  // Offline Fallback
  offlineTitle: string;
  offlineMessage: string;
  offlineRetryText: string;
  enableOfflineGame: boolean;
}

export function generateWebToApkFiles(config: WebToApkConfig) {
  const pkgDir = config.packageName.replace(/\./g, "/");

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}"
    android:versionCode="${config.versionCode}"
    android:versionName="${config.versionName}">

    <!-- Permissions required for web connectivity and hardware features -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    ${config.enableCamera ? '<uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />' : ""}
    ${config.enableGeolocation ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />' : ""}
    ${config.enableFileUploads ? '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />' : ""}

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="${config.appName}"
        android:theme="@style/WebApkTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        ${config.enableSplash ? `<!-- Splash Screen Entry Activity -->
        <activity
            android:name=".SplashActivity"
            android:exported="true"
            android:screenOrientation="${config.orientation === "portrait" ? "portrait" : config.orientation === "landscape" ? "landscape" : "unspecified"}"
            android:theme="@style/WebApkTheme.Splash">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Main WebView Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="false"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="${config.orientation === "portrait" ? "portrait" : config.orientation === "landscape" ? "landscape" : "unspecified"}"
            android:windowSoftInputMode="adjustResize" />` : `<!-- Main WebView Activity (Launcher) -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="${config.orientation === "portrait" ? "portrait" : config.orientation === "landscape" ? "landscape" : "unspecified"}"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>`}

    </application>
</manifest>`;

  // SplashActivity Java (if enabled)
  const splashActivityJava = `package ${config.packageName};

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.ImageView;
import android.widget.TextView;

/**
 * GADIAN Web-To-APK Animated Splash Screen
 * Automatically navigates to MainActivity after ${config.splashDurationMs}ms.
 */
public class SplashActivity extends Activity {

    public static final int SPLASH_DURATION = ${config.splashDurationMs};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        ImageView logo = (ImageView) findViewById(R.id.splash_logo);
        TextView title = (TextView) findViewById(R.id.splash_title);

        // ${config.splashAnimation.toUpperCase()} animation
        Animation fadeIn = new AlphaAnimation(0.0f, 1.0f);
        fadeIn.setDuration(800);
        if (logo != null) logo.startAnimation(fadeIn);
        if (title != null) title.startAnimation(fadeIn);

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            }
        }, SPLASH_DURATION);
    }
}
`;

  // MainActivity Java
  const mainActivityJava = `package ${config.packageName};

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

/**
 * GADIAN Web-To-APK Native Android Wrapper
 * Target URL: ${config.url}
 * Hardware Acceleration: Enabled | AIDE Compilable
 */
public class MainActivity extends Activity {

    public static final String TARGET_URL = "${config.url}";
    public static final String ALLOWED_DOMAINS = "${config.allowedDomains || ""}";

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private ValueCallback<Uri[]> mFilePathCallback;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = (WebView) findViewById(R.id.webView);
        mProgressBar = (ProgressBar) findViewById(R.id.progressBar);

        setupWebSettings();

        if (isNetworkAvailable()) {
            mWebView.loadUrl(TARGET_URL);
        } else {
            // Load local offline experience
            mWebView.loadUrl("file:///android_asset/offline.html");
            Toast.makeText(this, "Operating in offline fallback mode", Toast.LENGTH_SHORT).show();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebSettings() {
        WebSettings s = mWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);

        ${config.enableZoom ? `s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);` : `s.setSupportZoom(false);`}

        ${config.userAgentMode === "desktop" ? `s.setUserAgentString("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");` : config.userAgentMode === "custom" && config.customUserAgent ? `s.setUserAgentString("${config.customUserAgent}");` : ""}

        ${config.enableCache ? `// Caching Strategy
        s.setAppCacheEnabled(true);
        s.setAppCachePath(getCacheDir().getAbsolutePath());
        s.setCacheMode(isNetworkAvailable() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);` : ""}

        mWebView.setWebViewClient(new AppWebViewClient());
        mWebView.setWebChromeClient(new AppWebChromeClient());
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo net = cm.getActiveNetworkInfo();
        return net != null && net.isConnected();
    }

    private class AppWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            if (mProgressBar != null) mProgressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (mProgressBar != null) mProgressBar.setVisibility(View.GONE);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            ${config.externalLinkHandling === "browser" ? `if (!url.startsWith(TARGET_URL)) {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(i);
                return true;
            }` : config.externalLinkHandling === "whitelist" && config.allowedDomains ? `String allowed = "${config.allowedDomains}";
            if (!url.contains(allowed)) {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(i);
                return true;
            }` : `// Stay inside WebApp container`}
            return false;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            mWebView.loadUrl("file:///android_asset/offline.html");
        }
    }

    private class AppWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (mProgressBar != null) {
                mProgressBar.setProgress(newProgress);
                if (newProgress == 100) mProgressBar.setVisibility(View.GONE);
            }
        }

        ${config.enableFileUploads ? `// File Chooser for HTML5 file inputs & camera uploads
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            mFilePathCallback = filePathCallback;
            Intent intent = fileChooserParams.createIntent();
            try {
                startActivityForResult(intent, 1001);
            } catch (Exception e) {
                mFilePathCallback = null;
                return false;
            }
            return true;
        }` : ""}
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
`;

  // Layouts
  const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="${config.statusBarColor || "#090d16"}">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:layout_alignParentTop="true"
        android:max="100"
        android:progressDrawable="@drawable/progress_gradient"
        android:visibility="gone" />

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_below="@id/progressBar" />

</RelativeLayout>`;

  const activitySplashXml = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="${config.splashBgColor || "#090d16"}">

    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:gravity="center"
        android:orientation="vertical">

        <ImageView
            android:id="@+id/splash_logo"
            android:layout_width="96dp"
            android:layout_height="96dp"
            android:src="@drawable/ic_launcher" />

        <TextView
            android:id="@+id/splash_title"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="20dp"
            android:text="${config.splashTitle || config.appName}"
            android:textColor="#ffffff"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:text="${config.splashSubtitle || "Mobile Application"}"
            android:textColor="#94a3b8"
            android:textSize="12sp" />

    </LinearLayout>

</RelativeLayout>`;

  // Styles & Colors
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${config.iconBgColor || "#10b981"}</color>
    <color name="statusBarColor">${config.statusBarColor || "#090d16"}</color>
    <color name="navBarColor">${config.navBarColor || "#090d16"}</color>
</resources>`;

  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="WebApkTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:statusBarColor">@color/statusBarColor</item>
        <item name="android:navigationBarColor">@color/navBarColor</item>
        <item name="android:windowBackground">@color/statusBarColor</item>
    </style>

    <style name="WebApkTheme.Splash" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowBackground">${config.splashBgColor || "#090d16"}</item>
        <item name="android:statusBarColor">${config.splashBgColor || "#090d16"}</item>
    </style>
</resources>`;

  // Offline HTML Experience with Mini Game
  const offlineHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>${config.appName} - Offline</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; background: #090d16; color: #f8fafc; text-align: center; margin: 0; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .card { max-width: 380px; width: 100%; background: #131b2e; padding: 24px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .icon { width: 56px; height: 56px; margin: 0 auto 16px; background: rgba(56, 189, 248, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        h1 { font-size: 20px; color: #38bdf8; margin: 0 0 8px; }
        p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px; }
        button { background: #10b981; color: #090d16; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; width: 100%; }
        button:active { transform: scale(0.98); }
        canvas { background: #090d16; border-radius: 8px; margin-top: 16px; border: 1px solid #334155; }
        .game-tip { font-size: 11px; color: #64748b; margin-top: 6px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">⚡</div>
        <h1>${config.offlineTitle || "Connection Lost"}</h1>
        <p>${config.offlineMessage || `Cannot reach ${config.url}. Please verify Wi-Fi or mobile data.`}</p>
        <button onclick="location.reload()">${config.offlineRetryText || "Retry Connection"}</button>
        ${config.enableOfflineGame ? `
        <canvas id="game" width="300" height="100"></canvas>
        <div class="game-tip">Tap canvas to jump while waiting!</div>
        <script>
            const canvas = document.getElementById('game');
            const ctx = canvas.getContext('2d');
            let x = 30, y = 70, vy = 0, isJumping = false, score = 0, obsX = 300;
            canvas.onclick = () => { if(!isJumping) { vy = -8; isJumping = true; } };
            function loop() {
                ctx.clearRect(0, 0, 300, 100);
                vy += 0.5; y += vy;
                if(y > 70) { y = 70; isJumping = false; }
                obsX -= 3; if(obsX < -20) { obsX = 300; score++; }
                ctx.fillStyle = '#10b981'; ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#f43f5e'; ctx.fillRect(obsX, 70, 14, 16);
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.fillText('Score: ' + score, 10, 15);
                requestAnimationFrame(loop);
            }
            loop();
        </script>` : ""}
    </div>
</body>
</html>`;

  const files = [
    { path: "AndroidManifest.xml", content: manifestXml },
    { path: "project.properties", content: "target=android-33\n" },
    {
      path: "build.gradle",
      content: `apply plugin: 'com.android.application'\nandroid {\n    compileSdkVersion 33\n    defaultConfig {\n        applicationId "${config.packageName}"\n        minSdkVersion 21\n        targetSdkVersion 33\n        versionCode ${config.versionCode}\n        versionName "${config.versionName}"\n    }\n}\n`,
    },
    { path: `src/${pkgDir}/MainActivity.java`, content: mainActivityJava },
    { path: "res/layout/activity_main.xml", content: activityMainXml },
    { path: "res/values/strings.xml", content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${config.appName}</string>\n</resources>` },
    { path: "res/values/colors.xml", content: colorsXml },
    { path: "res/values/styles.xml", content: stylesXml },
    { path: "assets/offline.html", content: offlineHtml },
  ];

  if (config.enableSplash) {
    files.push({ path: `src/${pkgDir}/SplashActivity.java`, content: splashActivityJava });
    files.push({ path: "res/layout/activity_splash.xml", content: activitySplashXml });
  }

  return files;
}

export async function createWebToApkZip(config: WebToApkConfig): Promise<Blob> {
  const zip = new JSZip();
  const files = generateWebToApkFiles(config);
  for (const f of files) {
    zip.file(`${config.appName}_WebToApk/${f.path}`, f.content);
  }
  return await zip.generateAsync({ type: "blob" });
}
