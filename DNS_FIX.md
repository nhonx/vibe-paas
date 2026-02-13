# DNS Wildcard Not Working - Fix Guide

## The Problem

```bash
dig guitar.ivibe.site
# Returns: NXDOMAIN (domain doesn't exist)
```

This means your wildcard DNS (`*.ivibe.site`) is **NOT configured correctly**.

---

## Solution: Configure Wildcard DNS

### Step 1: Go to Your Domain Registrar

Where you bought `ivibe.site` (GoDaddy, Namecheap, Cloudflare, etc.)

### Step 2: Add DNS Records

You need **TWO** A records:

#### Record 1: Main Domain
```
Type: A
Name: @ (or leave blank, or "ivibe.site")
Value: YOUR_VPS_IP
TTL: 3600 (or Auto)
```

#### Record 2: Wildcard Subdomain ⭐ IMPORTANT
```
Type: A
Name: * (asterisk)
Value: YOUR_VPS_IP
TTL: 3600 (or Auto)
```

### Example (Namecheap):
```
Host        Type    Value           TTL
@           A       123.45.67.89    Automatic
*           A       123.45.67.89    Automatic
```

### Example (Cloudflare):
```
Type    Name    Content         Proxy   TTL
A       @       123.45.67.89    No      Auto
A       *       123.45.67.89    No      Auto
```

### Example (GoDaddy):
```
Type    Name    Value           TTL
A       @       123.45.67.89    1 Hour
A       *       123.45.67.89    1 Hour
```

---

## Important Notes

### ⚠️ Common Mistakes

1. **Using `*.ivibe.site` instead of just `*`**
   - ❌ Wrong: `*.ivibe.site`
   - ✅ Correct: `*`

2. **Forgetting the asterisk**
   - ❌ Wrong: Just `@` record
   - ✅ Correct: Both `@` AND `*` records

3. **Cloudflare Proxy Enabled**
   - If using Cloudflare, turn OFF the orange cloud (proxy)
   - ✅ Should be gray cloud (DNS only)

4. **CNAME instead of A record**
   - ❌ Wrong: CNAME record for wildcard
   - ✅ Correct: A record for wildcard

---

## Wait for DNS Propagation

After adding the records:
- **Minimum wait**: 5-10 minutes
- **Maximum wait**: 24-48 hours
- **Typical**: 15-30 minutes

---

## Test DNS Configuration

### Test 1: Main Domain
```bash
dig ivibe.site +short
# Should return: YOUR_VPS_IP
```

### Test 2: Wildcard (any subdomain)
```bash
dig guitar.ivibe.site +short
dig test.ivibe.site +short
dig anything.ivibe.site +short
# All should return: YOUR_VPS_IP
```

### Test 3: From Different DNS Server
```bash
# Test using Google DNS
dig @8.8.8.8 guitar.ivibe.site +short

# Test using Cloudflare DNS
dig @1.1.1.1 guitar.ivibe.site +short
```

### Test 4: Using nslookup
```bash
nslookup guitar.ivibe.site
# Should show your VPS IP
```

---

## While Waiting for DNS

You can still test your projects using the **Host header**:

```bash
# Test without DNS
curl -H "Host: guitar.ivibe.site" http://localhost

# Or test from your VPS IP
curl -H "Host: guitar.ivibe.site" http://YOUR_VPS_IP
```

This bypasses DNS and tests if Nginx is configured correctly.

---

## Verify Nginx is Ready

Even though DNS isn't working, let's make sure Nginx is configured:

```bash
# 1. Check if config exists
sudo ls -la /etc/nginx/sites-enabled/guitar.conf

# 2. View the config
sudo cat /etc/nginx/sites-enabled/guitar.conf

# 3. Test Nginx syntax
sudo nginx -t

# 4. Test with Host header
curl -v -H "Host: guitar.ivibe.site" http://localhost
```

If this returns **200 OK**, then Nginx is working and you just need to wait for DNS.

---

## Quick DNS Check Script

Save this as `check-dns.sh`:

```bash
#!/bin/bash
DOMAIN="ivibe.site"
SUBDOMAIN="${1:-guitar}"

echo "Checking DNS for $SUBDOMAIN.$DOMAIN..."
echo ""

echo "1. Main domain:"
dig $DOMAIN +short

echo ""
echo "2. Subdomain:"
dig $SUBDOMAIN.$DOMAIN +short

echo ""
echo "3. Google DNS:"
dig @8.8.8.8 $SUBDOMAIN.$DOMAIN +short

echo ""
echo "4. Cloudflare DNS:"
dig @1.1.1.1 $SUBDOMAIN.$DOMAIN +short

echo ""
if dig $SUBDOMAIN.$DOMAIN +short | grep -q '[0-9]'; then
    echo "✓ DNS is working!"
else
    echo "✗ DNS not configured or still propagating"
    echo ""
    echo "Add this to your DNS:"
    echo "  Type: A"
    echo "  Name: *"
    echo "  Value: $(curl -s ifconfig.me)"
fi
```

Run it:
```bash
chmod +x check-dns.sh
./check-dns.sh guitar
```

---

## Temporary Solution: Edit Hosts File

While waiting for DNS, you can test locally by editing your hosts file:

### On Linux/Mac:
```bash
sudo nano /etc/hosts
```

Add:
```
YOUR_VPS_IP guitar.ivibe.site
YOUR_VPS_IP test.ivibe.site
```

### On Windows:
```
C:\Windows\System32\drivers\etc\hosts
```

Add:
```
YOUR_VPS_IP guitar.ivibe.site
YOUR_VPS_IP test.ivibe.site
```

Then test in browser: `http://guitar.ivibe.site`

---

## Common DNS Provider Instructions

### Namecheap
1. Login → Domain List → Manage
2. Advanced DNS tab
3. Add New Record:
   - Type: A Record
   - Host: `*`
   - Value: Your VPS IP
   - TTL: Automatic

### GoDaddy
1. Login → My Products → DNS
2. Add → A Record
   - Name: `*`
   - Value: Your VPS IP
   - TTL: 1 Hour

### Cloudflare
1. Login → Select Domain → DNS
2. Add record:
   - Type: A
   - Name: `*`
   - IPv4 address: Your VPS IP
   - Proxy status: DNS only (gray cloud)
   - TTL: Auto

### Google Domains
1. Login → My Domains → Manage
2. DNS → Custom records
3. Add:
   - Host name: `*`
   - Type: A
   - TTL: 1h
   - Data: Your VPS IP

---

## Verification Checklist

After configuring DNS, verify:

- [ ] Main domain resolves: `dig ivibe.site +short`
- [ ] Wildcard resolves: `dig guitar.ivibe.site +short`
- [ ] Different subdomains work: `dig test.ivibe.site +short`
- [ ] Google DNS sees it: `dig @8.8.8.8 guitar.ivibe.site +short`
- [ ] Nginx config exists: `ls /etc/nginx/sites-enabled/guitar.conf`
- [ ] Nginx test passes: `sudo nginx -t`
- [ ] HTTP works: `curl http://guitar.ivibe.site`

---

## Still Not Working After 1 Hour?

### Check Your DNS Provider

Some providers have issues with wildcard records:

1. **Check if wildcards are supported**
   - Most do, but some cheap providers don't

2. **Try using a DNS service**
   - Transfer DNS to Cloudflare (free)
   - Use Route53 (AWS)
   - Use DigitalOcean DNS

3. **Contact support**
   - Ask: "How do I add a wildcard A record for *.ivibe.site?"

### Alternative: Use Individual Records

If wildcard doesn't work, add each subdomain manually:

```
Type: A, Name: guitar, Value: YOUR_IP
Type: A, Name: test, Value: YOUR_IP
Type: A, Name: app1, Value: YOUR_IP
```

(Not ideal, but works)

---

## Get Your VPS IP

If you don't know your VPS IP:

```bash
# On VPS
curl ifconfig.me
# or
curl icanhazip.com
# or
ip addr show
```

---

## Summary

**The issue:** Wildcard DNS (`*.ivibe.site`) is not configured.

**The fix:** Add A record with name `*` pointing to your VPS IP.

**Wait time:** 5-30 minutes typically.

**Test:** `dig guitar.ivibe.site` should return your VPS IP.

**Meanwhile:** Use Host header to test: `curl -H "Host: guitar.ivibe.site" http://YOUR_VPS_IP`
