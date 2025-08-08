# 🚀 Deployment Instructions

This guide covers how to deploy the quiz application to various hosting platforms.

## 📋 Pre-deployment Checklist

- [ ] Google Apps Script is set up and deployed
- [ ] `config.js` contains the correct Google Apps Script URL
- [ ] Test the application locally to ensure it works
- [ ] Admin dashboard shows proper connection status

## 🌐 GitHub Pages (Recommended)

### Quick Deploy
1. **Fork this repository** to your GitHub account
2. **Go to repository Settings** → Pages
3. **Source**: Deploy from a branch
4. **Branch**: Select `main` or `master`
5. **Save** and wait for deployment

Your app will be available at: `https://[username].github.io/quiz-viet-uc-vinh-long`

### Update Website URL
After deployment, update the website URL in `config.js`:
```javascript
WEBSITE_URL: 'https://[username].github.io/quiz-viet-uc-vinh-long'
```

## 🔧 Other Hosting Platforms

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: (leave empty)
3. Set publish directory: `/` (root)
4. Deploy

### Vercel  
1. Import your GitHub repository to Vercel
2. Framework preset: "Other"
3. Deploy

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase init hosting`
3. Set public directory: `.` (current directory)
4. Configure as single-page app: No
5. Run `firebase deploy`

## 📱 Testing After Deployment

### 1. Basic Functionality Test
- [ ] Main page loads correctly
- [ ] QR code is generated (or fallback is shown)
- [ ] Admin dashboard loads at `/admin.html`
- [ ] Student interface loads at `/student.html`

### 2. Google Sheets Integration Test
- [ ] Admin dashboard shows connection status
- [ ] Click "🧪 Test kết nối" shows appropriate result
- [ ] Submit a test quiz to verify data saving
- [ ] Check Google Sheets for new data

### 3. Mobile Responsiveness Test
- [ ] Test on mobile devices
- [ ] Admin dashboard is responsive
- [ ] Quiz interface works on mobile
- [ ] QR code scanning works properly

## 🔒 Security Considerations

### Google Apps Script
- ✅ Web app is deployed with "Anyone" access (required for CORS)
- ✅ Data is only stored in your private Google Sheet
- ✅ No sensitive data is exposed in client-side code

### Hosting
- ✅ All files are static (HTML, CSS, JS)
- ✅ No server-side vulnerabilities
- ✅ HTTPS is automatically provided by most platforms

## 🐛 Common Deployment Issues

### QR Code Not Working
- **Issue**: QR code shows fallback instead of actual QR
- **Solution**: Update `WEBSITE_URL` in `config.js` with your actual deployed URL

### Google Sheets Connection Failed
- **Issue**: Admin dashboard shows "Offline" even after deployment
- **Solution**: 
  1. Verify Google Apps Script URL is correct
  2. Check that web app is deployed with "Anyone" access
  3. Test the script URL directly in browser

### Assets Not Loading
- **Issue**: Images or icons not displaying
- **Solution**: Check file paths are relative (not absolute)

## 📊 Analytics & Monitoring

### Google Analytics (Optional)
Add Google Analytics to track usage:

1. Create Google Analytics property
2. Add tracking code to `index.html`, `admin.html`, and `student.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Uptime Monitoring
Consider using services like:
- **UptimeRobot** - Free uptime monitoring
- **StatusCake** - Website monitoring
- **Pingdom** - Performance monitoring

## 🔄 Updates & Maintenance

### Updating the Application
1. Make changes to your forked repository
2. Commit and push changes
3. GitHub Pages will automatically redeploy
4. Test the updated application

### Backup Strategy
- ✅ Google Sheets serves as primary data backup
- ✅ localStorage provides client-side backup
- ✅ Repository code is backed up on GitHub
- ✅ Consider periodic Google Sheets exports

## 📞 Support

If you encounter issues during deployment:

1. **Check the browser console** for error messages
2. **Verify all URLs** in config.js are correct
3. **Test Google Apps Script** independently
4. **Review the setup guide** at [docs/GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Quiz application loads without errors
- [ ] Admin dashboard shows real-time data
- [ ] Students can complete quizzes successfully  
- [ ] Data appears in Google Sheets (or localStorage if offline)
- [ ] Mobile devices can access and use the application
- [ ] QR code redirects to the correct student interface