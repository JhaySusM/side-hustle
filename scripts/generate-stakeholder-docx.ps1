param(
  [string]$OutputPath = "./docs/STAKEHOLDER_HANDOFF.docx"
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
  @{ Type = "title"; Text = "Batjee / TradiGo Stakeholder Handoff" },
  @{ Type = "meta"; Text = "Prepared for non-technical review and project handoff" },
  @{ Type = "heading1"; Text = "Executive Summary" },
  @{ Type = "body"; Text = "Batjee, branded in the interface as TradiGo, is a marketplace platform focused on local buying and selling in Pakistan. It already supports the full core journey from account creation, listing, browsing, and messaging through to moderation, seller ratings, support chat, and a structured transaction and platform-fee workflow for completed deals." },
  @{ Type = "heading1"; Text = "What This Product Is" },
  @{ Type = "body"; Text = "The platform is a local classifieds and marketplace product where sellers can publish ads and buyers can discover items, contact sellers, and complete deals. It is more than a listing board because it also includes moderation tools, support workflows, and internal controls that help manage quality and trust." },
  @{ Type = "heading1"; Text = "What Users Can Do" },
  @{ Type = "heading2"; Text = "Account and onboarding" },
  @{ Type = "bullet"; Text = "Create an account with name, email, password, and address details." },
  @{ Type = "bullet"; Text = "Log in and maintain a session in the app." },
  @{ Type = "bullet"; Text = "Join with a referral code from an invite link." },
  @{ Type = "heading2"; Text = "Buying experience" },
  @{ Type = "bullet"; Text = "Browse active marketplace listings." },
  @{ Type = "bullet"; Text = "Search by keyword, category, and location." },
  @{ Type = "bullet"; Text = "Open a product page with images, pricing, seller details, and safety guidance." },
  @{ Type = "bullet"; Text = "Message sellers directly from a listing." },
  @{ Type = "bullet"; Text = "Save listings to favorites for later review." },
  @{ Type = "bullet"; Text = "Rate sellers after interacting with them." },
  @{ Type = "bullet"; Text = "Report suspicious listings or abusive sellers." },
  @{ Type = "heading2"; Text = "Selling experience" },
  @{ Type = "bullet"; Text = "Post a new ad with title, description, category, price, and images." },
  @{ Type = "bullet"; Text = "See listing status inside a dashboard." },
  @{ Type = "bullet"; Text = "Track active, pending, inactive, and sold ads." },
  @{ Type = "bullet"; Text = "Share a personal referral code and referral link." },
  @{ Type = "bullet"; Text = "Manage deals through in-app chat and transaction steps." },
  @{ Type = "heading1"; Text = "How the Marketplace Works" },
  @{ Type = "bullet"; Text = "A seller creates an ad with images and product details." },
  @{ Type = "bullet"; Text = "New listings do not go live immediately; they first enter a pending state for admin review." },
  @{ Type = "bullet"; Text = "Only approved active listings appear in the public marketplace." },
  @{ Type = "bullet"; Text = "Buyers and sellers communicate inside the app instead of outside channels." },
  @{ Type = "bullet"; Text = "The conversation can carry a structured deal amount, completion steps, and fee submission." },
  @{ Type = "bullet"; Text = "Once both sides confirm completion, the listing is marked sold." },
  @{ Type = "heading1"; Text = "Messaging and Deal Management" },
  @{ Type = "body"; Text = "Messaging is one of the strongest existing parts of the product. It lets buyers and sellers communicate directly inside the platform, which keeps engagement and trust-building within the app rather than sending users to external apps immediately." },
  @{ Type = "bullet"; Text = "Users can open conversations from product pages and seller pages." },
  @{ Type = "bullet"; Text = "Users can send both text and image attachments." },
  @{ Type = "bullet"; Text = "Unread counts are tracked and shown in the mobile navigation." },
  @{ Type = "bullet"; Text = "Support conversations with the admin team reuse the same chat system." },
  @{ Type = "body"; Text = "On top of chat, the platform includes a structured transaction layer. This allows both sides to confirm an agreed amount, mark a deal completed, and track the related platform fee before final administrative verification." },
  @{ Type = "heading1"; Text = "Admin and Backoffice Capabilities" },
  @{ Type = "bullet"; Text = "Approve or reject newly submitted listings." },
  @{ Type = "bullet"; Text = "Review and respond to support messages." },
  @{ Type = "bullet"; Text = "Inspect and resolve user-submitted abuse and fraud reports." },
  @{ Type = "bullet"; Text = "Verify platform fee payments attached to completed transactions." },
  @{ Type = "bullet"; Text = "Send in-app notification campaigns to users." },
  @{ Type = "bullet"; Text = "Apply promotional seller placements such as homepage or search boosts." },
  @{ Type = "heading1"; Text = "Trust and Safety Features" },
  @{ Type = "bullet"; Text = "Listing moderation before public visibility." },
  @{ Type = "bullet"; Text = "Seller ratings and review comments." },
  @{ Type = "bullet"; Text = "Product and seller reporting flows." },
  @{ Type = "bullet"; Text = "Support chat with platform admins." },
  @{ Type = "bullet"; Text = "Account status control for inactive or suspended users." },
  @{ Type = "heading1"; Text = "Growth and Retention Features" },
  @{ Type = "bullet"; Text = "Referral codes and invite links." },
  @{ Type = "bullet"; Text = "Favorites for saved browsing intent." },
  @{ Type = "bullet"; Text = "In-app notifications for announcements and campaigns." },
  @{ Type = "bullet"; Text = "Seller promotion placements to improve listing visibility." },
  @{ Type = "heading1"; Text = "Current Product Strengths" },
  @{ Type = "bullet"; Text = "The core marketplace loop is already implemented end to end." },
  @{ Type = "bullet"; Text = "The product goes beyond simple listings by including trust, moderation, and support flows." },
  @{ Type = "bullet"; Text = "There is already an administrative path for revenue tracking through transaction fee verification." },
  @{ Type = "bullet"; Text = "The app includes both buyer-facing and seller-facing value, not just one side." },
  @{ Type = "bullet"; Text = "The dashboard, chat, ratings, reports, and notification systems create a strong base for growth." },
  @{ Type = "heading1"; Text = "Current Constraints to Know Before Launch or Scale" },
  @{ Type = "bullet"; Text = "User password handling should be strengthened before a wider production rollout." },
  @{ Type = "bullet"; Text = "Admin access control is functional but should be hardened for long-term production use." },
  @{ Type = "bullet"; Text = "Realtime chat refresh works well for a single deployment instance but will need a more scalable architecture for larger traffic." },
  @{ Type = "bullet"; Text = "The admin dashboard exists today as a separate static backoffice interface, which is workable but not ideal for long-term maintainability." },
  @{ Type = "bullet"; Text = "The fee workflow is tracked inside the app, but it is not yet tied to a full payment gateway integration." },
  @{ Type = "heading1"; Text = "Recommended Next-Phase Priorities" },
  @{ Type = "bullet"; Text = "Harden authentication for both users and admins." },
  @{ Type = "bullet"; Text = "Add a production-grade realtime layer for messaging." },
  @{ Type = "bullet"; Text = "Integrate real payment rails for platform fee collection." },
  @{ Type = "bullet"; Text = "Rebuild the admin backoffice inside the main app." },
  @{ Type = "bullet"; Text = "Add analytics and reporting dashboards." },
  @{ Type = "heading1"; Text = "Simple Stakeholder Takeaway" },
  @{ Type = "body"; Text = "This is already more than a prototype listing site. It is a functioning marketplace foundation with moderation, trust features, messaging, dashboarding, referrals, notifications, and transaction governance. The main next step is not feature invention; it is production hardening, scaling decisions, and refinement of admin and payment infrastructure." }
)

$bodyBuilder = New-Object System.Text.StringBuilder

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
      [void]$bodyBuilder.Append('<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "heading2" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/></w:rPr><w:t>')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
    }
    "bullet" {
      [void]$bodyBuilder.Append('<w:p><w:r><w:t xml:space="preserve">• ')
      [void]$bodyBuilder.Append($text)
      [void]$bodyBuilder.Append('</w:t></w:r></w:p>')
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

$tempRoot = Join-Path $env:TEMP ("stakeholder_docx_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "word") | Out-Null

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "[Content_Types].xml"), $contentTypes.Trim(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "_rels\.rels"), $rootRels.Trim(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "word\document.xml"), $documentXml.Trim(), $utf8NoBom)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $resolvedOutputPath) {
  Remove-Item $resolvedOutputPath -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $resolvedOutputPath)
Remove-Item $tempRoot -Recurse -Force

Get-Item $resolvedOutputPath | Select-Object FullName, Length, LastWriteTime