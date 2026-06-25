param(
  [string]$OutputPath = "./docs/USER_DEMO_DOCUMENTATION.docx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Escape-Xml {
  param([string]$Text)

  if ($null -eq $Text) {
    return ""
  }

  return [System.Security.SecurityElement]::Escape($Text)
}

$paragraphs = @(
  @{ Type = "title"; Text = "Batjee / TradiGo User Functionality Guide" },
  @{ Type = "meta"; Text = "Step-by-step user handoff document" },
  @{ Type = "heading1"; Text = "1. Create an Account" },
  @{ Type = "number"; Text = "Open the website." },
  @{ Type = "number"; Text = "Click the sign in or register button." },
  @{ Type = "number"; Text = "Open the Register tab." },
  @{ Type = "number"; Text = "Enter your full name." },
  @{ Type = "number"; Text = "Enter your email address." },
  @{ Type = "number"; Text = "Enter your referral code if you have one." },
  @{ Type = "number"; Text = "Enter your house number, street number, area, city, postal code, and country." },
  @{ Type = "number"; Text = "Enter your password." },
  @{ Type = "number"; Text = "Confirm your password." },
  @{ Type = "number"; Text = "Submit the registration form." },
  @{ Type = "heading1"; Text = "2. Log In" },
  @{ Type = "number"; Text = "Open the website." },
  @{ Type = "number"; Text = "Click the sign in button." },
  @{ Type = "number"; Text = "Enter your email address." },
  @{ Type = "number"; Text = "Enter your password." },
  @{ Type = "number"; Text = "Click Sign In." },
  @{ Type = "heading1"; Text = "3. Browse the Homepage" },
  @{ Type = "number"; Text = "Open the homepage." },
  @{ Type = "number"; Text = "Scroll through the hero section, categories, and featured listings." },
  @{ Type = "number"; Text = "Click a category or listing to continue browsing." },
  @{ Type = "heading1"; Text = "4. Search for a Product" },
  @{ Type = "number"; Text = "Open the marketplace or listings page." },
  @{ Type = "number"; Text = "Enter a keyword into the search bar." },
  @{ Type = "number"; Text = "Press Enter or submit the search." },
  @{ Type = "number"; Text = "Review the filtered results." },
  @{ Type = "heading1"; Text = "5. Filter Listings by Category or Location" },
  @{ Type = "number"; Text = "Open the marketplace or listings page." },
  @{ Type = "number"; Text = "Select a category filter if needed." },
  @{ Type = "number"; Text = "Enter a location if needed." },
  @{ Type = "number"; Text = "Apply the filters." },
  @{ Type = "number"; Text = "Review the updated listing results." },
  @{ Type = "heading1"; Text = "6. Open a Product Page" },
  @{ Type = "number"; Text = "Open the marketplace or listings page." },
  @{ Type = "number"; Text = "Click any listing card." },
  @{ Type = "number"; Text = "Review the product name, price, images, description, and seller information." },
  @{ Type = "heading1"; Text = "7. Save a Listing to Favorites" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open a listing from the marketplace or product page." },
  @{ Type = "number"; Text = "Click the favorite or heart button." },
  @{ Type = "number"; Text = "Open your dashboard or favorites area to confirm it was saved." },
  @{ Type = "heading1"; Text = "8. Remove a Listing from Favorites" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard or favorites area." },
  @{ Type = "number"; Text = "Find the saved listing." },
  @{ Type = "number"; Text = "Click the remove favorite or unfavorite action." },
  @{ Type = "heading1"; Text = "9. Open a Seller Profile" },
  @{ Type = "number"; Text = "Open a product page." },
  @{ Type = "number"; Text = "Click the seller profile link or seller name if available." },
  @{ Type = "number"; Text = "Review the seller's listings and rating information." },
  @{ Type = "heading1"; Text = "10. Send a Message to a Seller" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open a product page or seller listing." },
  @{ Type = "number"; Text = "Enter your message in the message field." },
  @{ Type = "number"; Text = "Click Send." },
  @{ Type = "number"; Text = "Open the Messages page to continue the conversation." },
  @{ Type = "heading1"; Text = "11. Open the Messages Inbox" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the Messages page from the navigation or mobile footer." },
  @{ Type = "number"; Text = "View your conversation list." },
  @{ Type = "number"; Text = "Click a conversation to open the chat thread." },
  @{ Type = "heading1"; Text = "12. Send an Image in Chat" },
  @{ Type = "number"; Text = "Open the Messages page." },
  @{ Type = "number"; Text = "Open a conversation." },
  @{ Type = "number"; Text = "Use the image upload option in the chat composer." },
  @{ Type = "number"; Text = "Select an image from your device." },
  @{ Type = "number"; Text = "Send the message with the image." },
  @{ Type = "heading1"; Text = "13. Open Support Chat" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the Messages page." },
  @{ Type = "number"; Text = "Use the support conversation option if available." },
  @{ Type = "number"; Text = "Type your concern or question." },
  @{ Type = "number"; Text = "Send the message and wait for an admin reply." },
  @{ Type = "heading1"; Text = "14. Post a New Listing" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the Post page." },
  @{ Type = "number"; Text = "Enter the listing title." },
  @{ Type = "number"; Text = "Select a category." },
  @{ Type = "number"; Text = "Enter the price." },
  @{ Type = "number"; Text = "Enter the description." },
  @{ Type = "number"; Text = "Upload one or more images." },
  @{ Type = "number"; Text = "Submit the listing." },
  @{ Type = "number"; Text = "Open your dashboard to track the listing status." },
  @{ Type = "heading1"; Text = "15. Check Listing Status" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Review your listing table." },
  @{ Type = "number"; Text = "Check whether the listing is Pending, Active, Inactive, or Sold." },
  @{ Type = "heading1"; Text = "16. Withdraw a Pending Listing" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Find a listing with Pending status." },
  @{ Type = "number"; Text = "Click Withdraw." },
  @{ Type = "heading1"; Text = "17. Reactivate an Inactive Listing" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Find a listing with Inactive status." },
  @{ Type = "number"; Text = "Click the action to make it Active again." },
  @{ Type = "heading1"; Text = "18. Mark a Listing as Sold" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Find the listing you want to mark as sold." },
  @{ Type = "number"; Text = "Use the sold action if it is available." },
  @{ Type = "heading1"; Text = "19. Use the Dashboard" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the dashboard." },
  @{ Type = "number"; Text = "Review your total listings, active listings, pending listings, and sold listings." },
  @{ Type = "number"; Text = "Review your favorites section." },
  @{ Type = "heading1"; Text = "20. Copy Your Referral Code" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Find your referral section." },
  @{ Type = "number"; Text = "Click Copy Code." },
  @{ Type = "heading1"; Text = "21. Copy Your Referral Link" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open your dashboard." },
  @{ Type = "number"; Text = "Find your referral link." },
  @{ Type = "number"; Text = "Click Copy Link." },
  @{ Type = "number"; Text = "Share the copied link with another user." },
  @{ Type = "heading1"; Text = "22. Rate a Seller" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the seller profile page." },
  @{ Type = "number"; Text = "Select a score from 1 to 5." },
  @{ Type = "number"; Text = "Enter a comment if needed." },
  @{ Type = "number"; Text = "Submit the rating." },
  @{ Type = "heading1"; Text = "23. Report a Listing" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the product page you want to report." },
  @{ Type = "number"; Text = "Select the report type." },
  @{ Type = "number"; Text = "Enter details about the issue." },
  @{ Type = "number"; Text = "Upload an image if needed." },
  @{ Type = "number"; Text = "Submit the report." },
  @{ Type = "heading1"; Text = "24. Report a Seller" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the seller profile page." },
  @{ Type = "number"; Text = "Select the report option." },
  @{ Type = "number"; Text = "Choose the report type." },
  @{ Type = "number"; Text = "Enter the details." },
  @{ Type = "number"; Text = "Upload an image if needed." },
  @{ Type = "number"; Text = "Submit the report." },
  @{ Type = "heading1"; Text = "25. Open Notifications" },
  @{ Type = "number"; Text = "Log in to your account." },
  @{ Type = "number"; Text = "Open the notifications area if available." },
  @{ Type = "number"; Text = "Review unread and previous notifications." },
  @{ Type = "heading1"; Text = "26. Mark Notifications as Read" },
  @{ Type = "number"; Text = "Open the notifications area." },
  @{ Type = "number"; Text = "Open a specific notification to mark it as read, or use the mark all as read action if available." },
  @{ Type = "heading1"; Text = "27. Start a Transaction in Chat" },
  @{ Type = "number"; Text = "Open the Messages page." },
  @{ Type = "number"; Text = "Open a conversation related to a listing." },
  @{ Type = "number"; Text = "Enter the agreed amount in the transaction section." },
  @{ Type = "number"; Text = "Save or create the transaction." },
  @{ Type = "heading1"; Text = "28. Confirm the Agreed Amount" },
  @{ Type = "number"; Text = "Open the conversation that contains the transaction." },
  @{ Type = "number"; Text = "Review the agreed amount." },
  @{ Type = "number"; Text = "Use the confirm amount action." },
  @{ Type = "number"; Text = "Wait for the other party to confirm as well." },
  @{ Type = "heading1"; Text = "29. Mark the Deal as Completed" },
  @{ Type = "number"; Text = "Open the conversation that contains the transaction." },
  @{ Type = "number"; Text = "Use the mark completed action after the meetup or handoff is done." },
  @{ Type = "number"; Text = "Wait for the other party to mark the deal completed too." },
  @{ Type = "heading1"; Text = "30. Submit Platform Fee Payment" },
  @{ Type = "number"; Text = "Open the completed transaction in the conversation." },
  @{ Type = "number"; Text = "Select the fee payment action." },
  @{ Type = "number"; Text = "Enter the payment method." },
  @{ Type = "number"; Text = "Enter the payment reference if needed." },
  @{ Type = "number"; Text = "Upload proof of payment if needed." },
  @{ Type = "number"; Text = "Submit the fee payment." },
  @{ Type = "heading1"; Text = "31. Use the Mobile Navigation" },
  @{ Type = "number"; Text = "Open the website on a mobile device or narrow screen." },
  @{ Type = "number"; Text = "Use the bottom navigation to open Home, Chat, Sell, My Ads, or Account." },
  @{ Type = "number"; Text = "Check the Chat icon for unread message count." },
  @{ Type = "heading1"; Text = "32. Use Back to Top" },
  @{ Type = "number"; Text = "Scroll down on a desktop page." },
  @{ Type = "number"; Text = "Click the Back to top button when it appears." },
  @{ Type = "heading1"; Text = "33. Important Notes" },
  @{ Type = "bullet"; Text = "You must be logged in to post listings, send messages, save favorites, submit reports, rate sellers, and use the dashboard." },
  @{ Type = "bullet"; Text = "New listings stay pending until an admin approves them." },
  @{ Type = "bullet"; Text = "If you have unpaid platform fees, you may be blocked from posting a new listing." }
)

$bodyBuilder = New-Object System.Text.StringBuilder
$numberIndex = 1

foreach ($paragraph in $paragraphs) {
  $text = Escape-Xml $paragraph.Text

  switch ($paragraph.Type) {
    "title" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "meta" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "heading1" {
      $numberIndex = 1
      [void]$bodyBuilder.Append('<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "bullet" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:t xml:space="preserve">• ')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "number" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:t xml:space="preserve">')
      [void]$bodyBuilder.Append($numberIndex)
      [void]$bodyBuilder.Append('. ')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
      $numberIndex += 1
    }
    default {
      [void]$bodyBuilder.Append('<w:p><w:r><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
  }
}

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" />
</Types>
"@

$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml" />
</Relationships>
"@

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($bodyBuilder.ToString())
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840" />
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" />
    </w:sectPr>
  </w:body>
</w:document>
"@

$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path $resolvedOutputPath -Parent

if (-not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$tempRoot = Join-Path $env:TEMP ("user_demo_docx_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "word") | Out-Null

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "[Content_Types].xml"), $contentTypes.Trim(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "_rels\.rels"), $rootRels.Trim(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "word\document.xml"), $documentXml.Trim(), $utf8NoBom)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $resolvedOutputPath) {
  try {
    Remove-Item $resolvedOutputPath -Force
  } catch {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($resolvedOutputPath)
    $extension = [System.IO.Path]::GetExtension($resolvedOutputPath)
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $resolvedOutputPath = Join-Path $outputDirectory ("{0}_{1}{2}" -f $baseName, $timestamp, $extension)
  }
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $resolvedOutputPath)
Remove-Item $tempRoot -Recurse -Force

Get-Item $resolvedOutputPath | Select-Object FullName, Length, LastWriteTime