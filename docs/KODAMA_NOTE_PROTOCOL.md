# Kodama Note Security Protocol

**Protocol:** KNP-1  
**Profile:** Production Security Candidate  
**Status:** Not production-proven until §14 is completed

## 1. Security Goal

Kodama Note provides private notes without accounts:

- the owner opens the note with a password;
- a reader can read but cannot edit;
- an editor can read and submit authorized edits;
- the backend stores and delivers data but cannot decrypt it.

Kodama uses **zero-knowledge** to mean that the Delivery Gate and storage system
never receive a plaintext note or a secret capable of decrypting it. This is
not a mathematical zero-knowledge proof system.

## 2. Threat Model

KNP-1 assumes:

- the Delivery Gate, database, storage system, or network may be compromised;
- the backend may replay, replace, fork, suppress, or delete stored records;
- an attacker may obtain the complete backend database;
- share URLs may be stolen;
- users may choose weak passwords.

KNP-1 trusts:

- the client code running on the user's device;
- the operating system's cryptographically secure random generator;
- the cryptographic implementations;
- the user's device while the note is unlocked.

A malicious frontend can steal passwords and plaintext. Therefore, protection
against a dishonest Delivery Gate requires a trusted client distributed
separately from that Delivery Gate. See §12.

## 3. Key Hierarchy

### 3.1 Owner Keys

```text
 Password + Salt
        │
        ▼
    Argon2id
        │
        ▼
  Master Secret
        │
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
Owner Wrapping Key         Owner Signing Seed
        │                         │
        │                         ▼
        │                 Ed25519 Key Pair
        │                         │
        ▼                         ▼
Unlock Content Key        Sign Owner Commands
                          (edit, rotate, delete)
```

For password `P`, random salt `S`, place `PID`, and note `NID`:

```text
MASTER       = Argon2id(P, S, parameters)
K_OWNER_WRAP = HKDF(MASTER, "kodama.note.owner-wrap.v1" || PID || NID)
OWNER_SEED   = HKDF(MASTER, "kodama.note.owner-sign.v1" || PID || NID)

(SK_OWNER, PK_OWNER) = Ed25519KeyPair(OWNER_SEED)
OWNER_ID = SHA-256(PK_OWNER)
```

The client keeps `P`, `MASTER`, `K_OWNER_WRAP`, and `SK_OWNER` private. The
backend stores `S`, the KDF parameters, and `PK_OWNER`.

Because `PK_OWNER` makes password guesses testable offline, Argon2id slows
guessing but cannot make a weak password safe.

### 3.2 Content Key

The note content key is independent of the password:

```text
CEK[e] = random(32 bytes)
```

`e` is the access epoch. `CEK[e]` encrypts the note and attachment manifest.

```text
                 Random Content Key
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
           Encrypt Note     Encrypt Manifest
                                   │
                                   ▼
                          Attachment File Keys


 Random Reader Secret             Owner Wrapping Key
          │                                │
          ▼                                ▼
 Wrap Content Key                 Wrap Content Key
          │                                │
          ▼                                ▼
 Reader Capability                   Owner Access
```

### 3.3 Authenticated Key Wrapping

Every wrapped content key uses AES-256-GCM with a fresh nonce and authenticated
context:

```text
wrap AAD =
protocol || suite || PID || NID || epoch ||
capability ID || role || owner ID
```

```text
OWNER_WRAPPED_CEK  = AEAD(K_OWNER_WRAP, CEK[e], wrap AAD)
READER_WRAPPED_CEK = AEAD(K_READER_WRAP, CEK[e], wrap AAD)
```

Changing the note, role, epoch, capability, owner, or protocol causes unwrap to
fail. A wrapped key must never be accepted outside its authenticated context.

## 4. Capabilities

### 4.1 Reader

The client generates a random reader secret:

```text
READER_SECRET = random(32 bytes)
K_READER_WRAP =
    HKDF(READER_SECRET, "kodama.note.reader-wrap.v1" || NID || capability ID)
```

The reader capability contains:

```text
note ID
capability ID
reader secret
owner public-key fingerprint
protocol and suite
epoch
optional trusted checkpoint
```

It is carried only in the URL fragment:

```text
https://note.kodama.page/{note-id}#read={capability}
```

Fragments are processed locally, then removed from the visible address using
`history.replaceState`. They must never enter server requests, analytics,
logs, referrers, or crash reports.

The reader can unwrap `CEK[e]` and decrypt the note. The reader has no accepted
signing key.

### 4.2 Editor

The owner creates a random Ed25519 editor key pair:

```text
(SK_EDITOR, PK_EDITOR) = Ed25519Generate()
```

The owner signs an editor certificate:

```text
EDITOR_CERT =
    note ID
    editor public key
    editor capability ID
    allowed operations
    access epoch
    policy version

EDITOR_CERT_SIGNATURE = Sign(SK_OWNER, EDITOR_CERT)
```

The editor capability contains a reader capability plus `SK_EDITOR`. The
backend receives only `PK_EDITOR`, the owner-signed certificate, and public
capability status.

The editor key signs edits; it never encrypts or wraps content.

### 4.3 Owner

The owner possesses the password-derived wrapping and signing keys. The owner
can read, edit, issue editor certificates, rotate capabilities, change the
password, and delete the note.

| Role | Can decrypt | Can sign edits | Can manage |
|---|---:|---:|---:|
| Reader | Yes | No | No |
| Editor | Yes | Yes, within certificate scope | No |
| Owner | Yes | Yes | Yes |

### 4.4 Owner-Signed Policy

The backend's capability status is not authoritative. The owner signs the
policy that identifies the valid owner, epoch, and editor certificates:

```text
POLICY =
    note ID
    owner ID
    access epoch
    policy version
    previous policy hash
    active editor certificate hashes
    minimum protocol and suite

POLICY_SIGNATURE = Ed25519.Sign(SK_OWNER, DeterministicCBOR(POLICY))
POLICY_HASH = SHA-256(DeterministicCBOR(POLICY) || POLICY_SIGNATURE)
```

Clients accept editor-signed states only when the editor certificate is active
in the referenced owner-signed policy.

## 5. Signed State Envelope

Encryption alone does not prove that the backend returned the newest authorized
state. Every note version is therefore encrypted, hash-linked, and signed.

```text
STATE_HEADER =
    protocol and suite
    place ID and note ID
    access epoch
    policy version
    policy hash
    version number
    random state ID
    previous state hash
    operation
    writer key ID
    ciphertext hash
    manifest hash

STATE_SIGNATURE =
    Ed25519.Sign(writer private key,
                 DeterministicCBOR(STATE_HEADER))

STATE_HASH =
    SHA-256(DeterministicCBOR(STATE_HEADER) ||
            STATE_SIGNATURE)
```

The encrypted note and manifest use separate per-state keys:

```text
STATE_ID = random(16 bytes)

K_STATE_NOTE =
    HKDF(CEK[e], "kodama.note.state-content.v1" ||
         NID || epoch || STATE_ID)

K_STATE_MANIFEST =
    HKDF(CEK[e], "kodama.note.state-manifest.v1" ||
         NID || epoch || STATE_ID)

NOTE_CIPHERTEXT =
    AES-256-GCM(K_STATE_NOTE, compressed note, fresh nonce, state AAD)

MANIFEST_CIPHERTEXT =
    AES-256-GCM(K_STATE_MANIFEST, manifest, fresh nonce, state AAD)
```

`state AAD` binds the protocol, suite, note ID, epoch, policy version, version,
state ID, previous state hash, operation, and purpose.

The writer signs the hashes of the completed ciphertext and manifest. This
avoids ambiguity and binds the stored encrypted objects to the authorized
version.

## 6. Client Verification

The client must reject a state unless all checks pass:

1. The owner fingerprint matches the one pinned in the owner or share
   capability.
2. The protocol and cryptographic suite are supported and not downgraded.
3. The state signature is valid.
4. An editor signature chains to a valid owner-signed editor certificate.
5. The certificate permits the operation and matches the epoch and policy.
6. The version follows the previous trusted state hash.
7. The ciphertext and manifest hashes match the signed header.
8. AES-GCM authentication succeeds.

The backend may also verify signatures and versions, but backend verification
is an availability optimization—not the security authority.

## 7. Rollback and Fork Detection

```text
Signed Version 1
       │
       ▼
Signed Version 2
 previous = hash(V1)
       │
       ▼
Signed Version 3
 previous = hash(V2)
       │
       ▼
Trusted Client Checkpoint
```

After every accepted state, the client stores:

```text
note ID
epoch
version
state hash
policy hash
```

The client rejects an older version or a state that is not a descendant of its
trusted checkpoint.

A share capability may include the latest checkpoint known when it was issued.
This prevents the backend from replaying a state older than that share.

Two clients can still accept different valid children of the same checkpoint
without immediately knowing that the backend created a fork. Comparing their
checkpoints reveals the conflict. Strong cross-device fork detection requires
checkpoint exchange or an independent append-only witness.

There is also an unavoidable limitation: a new device holding only an old
static link cannot prove that the backend has shown the globally newest state.
Kodama must not claim otherwise.

## 8. Backend Knowledge

```text
               Trusted Client
                     │
          Encrypt, Hash and Sign
                     │
                     ▼
               Delivery Gate
                     │
                     ▼
     Ciphertext + Signatures + Public Keys
                     │
                     ▼
                  Storage


Backend Never Receives:
password or master secret
plaintext note
unwrapped content or file keys
reader secret
owner or editor private keys
```

The backend may observe identifiers, sizes, timing, access patterns, network
information, epochs, versions, and public capability status.

## 9. Attachments and Compression

Structured note data is deterministically encoded, compressed with Brotli, and
then encrypted. Attachments are not compressed by the protocol.

Each attachment uses:

```text
K_FILE = random(32 bytes)
```

For each chunk:

```text
K_CHUNK =
    HKDF(K_FILE, "kodama.note.file-chunk.v1" ||
         attachment ID || chunk index)
```

The chunk is encrypted with AES-256-GCM using a fresh nonce and authenticated
with the note ID, attachment ID, chunk index, total chunks, plaintext size, and
protocol version. The encrypted manifest contains file names, types, sizes,
hashes, chunk counts, and `K_FILE`.

The manifest must include a hash of every encrypted attachment or a Merkle root
covering all chunks. This detects omission, truncation, replacement, and
reordering.

Compression leaks approximate plaintext length. The client should pad
structured ciphertext into documented size buckets when length leakage is
material.

## 10. Rotation

### Password Change

```text
Old Password ──► Old Owner Key ──► Unwrap CEK
                                      │
New Password ──► New Owner Key ──► Rewrap CEK

Encrypted note remains unchanged.
```

A password change creates a new salt, master secret, owner wrapping key, and
owner signing key. The transition record is signed by both old and new owner
keys and atomically replaces the owner public key and wrapped `CEK`.

This is safe for a routine password change. It does not revoke someone who
already has the old password and an old wrapped-key record.

### Editor Rotation

The owner publishes a new signed policy that removes the previous editor key
and, if needed, issues a replacement editor certificate. This stops future
authorized writes. It does not remove read access already held by that editor.

### Full Access Rotation

```text
     Old Content Key
            │
            ▼
  Decrypt Current State
            │
            ▼
     New Content Key
            │
       ┌────┴─────┐
       │          │
       ▼          ▼
Reencrypt Note  Reencrypt Manifest
       │          │
       └────┬─────┘
            ▼
 Generate New Capabilities
            │
            ▼
Old Capabilities Cannot Read
Future Note Versions
```

Full rotation creates a new access epoch and `CEK`. It reencrypts the current
note and manifest and replaces reader capabilities. Editor certificates must
be reissued for the new epoch.

Existing encrypted attachment blobs may remain unchanged because their file
keys are inside the reencrypted manifest. However, a previous recipient may
already know those file keys. Revoking access to existing attachments requires
new file keys and re-encryption of the attachment blobs.

No rotation can erase plaintext or keys already copied by a recipient.

## 11. Access Loss

Kodama has no account, recovery email, or server-held recovery key.

- Losing the owner password loses owner access.
- Losing every valid capability loses shared access.
- Clearing an unsynchronized device may destroy its checkpoint and keys.
- The backend cannot reset a password or reconstruct a secret.

The client must warn before password changes, full rotation, key deletion, or
checkpoint deletion. Recovery exists only through another retained capability
or a client-created encrypted backup.

## 12. Trusted Client Requirements

A web server that supplies the cryptographic JavaScript can replace that code
and steal secrets. Therefore:

- the Delivery Gate must never serve executable client code;
- production desktop and mobile clients must use signed releases;
- web security claims require a separately controlled, hardened static origin;
- the cryptographic bundle must be versioned, reproducible, and independently
  verifiable;
- note routes must load no third-party scripts;
- the web client must use a strict Content Security Policy and Trusted Types;
- cryptographic operations should run in an isolated worker or native module;
- secrets must never enter logs, telemetry, crash reports, URLs other than
  fragments, or persistent browser storage without encryption;
- plaintext and key memory must be cleared on lock where the runtime permits;
- all communication still requires HTTPS.

These controls reduce frontend compromise but cannot make arbitrary JavaScript
served by a malicious origin trustworthy. The strongest client is an installed,
signed application with verified updates.

## 13. Security Claims and Limits

When the protocol is implemented correctly and the client has a trusted owner
fingerprint and checkpoint, KNP-1 provides:

- **Confidentiality:** a malicious Delivery Gate cannot decrypt note content or
  attachments.
- **Authenticity:** clients accept only states signed by the owner or a
  properly certified editor.
- **Integrity:** ciphertext, manifests, policy, and version relationships are
  cryptographically verified.
- **Rollback detection:** clients reject state older than or unrelated to their
  trusted checkpoint.
- **Fork detection:** conflicting branches are detectable when trusted
  checkpoints are compared or through an independent witness.
- **Read-only sharing:** a reader has no accepted write key.
- **Scoped editing:** an editor cannot exercise owner management authority.
- **Cryptographic revocation:** a new content-key epoch excludes old
  capabilities from future content.

KNP-1 does not provide:

- availability or protection against deletion and suppression;
- global freshness on a new device without a recent checkpoint or witness;
- protection from a compromised client, device, browser, or extension;
- protection from weak passwords and offline guessing;
- secrecy from an authorized recipient;
- complete metadata hiding;
- recovery when every secret and backup is lost.

## 14. Production-Proven Gate

This protocol becomes production-proven only after all of the following are
complete:

1. A frozen wire format and cryptographic suite.
2. Published deterministic test vectors for derivation, wrapping, encryption,
   signatures, certificates, rotation, and error cases.
3. Cross-platform interoperability tests for browser, desktop, and mobile.
4. Negative tests for nonce reuse, wrong AAD, downgrade, replay, fork,
   truncation, corrupted ciphertext, invalid certificates, and stale policy.
5. Fuzzing of every parser and envelope decoder.
6. Dependency review, pinned builds, software bill of materials, and signed
   releases.
7. Independent cryptographic protocol and implementation audits.
8. Remediation and retesting of all critical and high-severity findings.
9. A staged release, incident-response procedure, and vulnerability disclosure
   program.

Until this gate is complete, Kodama must describe KNP-1 as a **production
security candidate**, not as audited or production-proven.

## 15. Required Cryptographic Profile

| Purpose | Requirement |
|---|---|
| Password KDF | Argon2id, version 0x13, salt at least 16 random bytes, output 32 bytes; minimum accepted cost 64 MiB and 3 passes |
| Key derivation | HKDF-SHA-256 with domain-separated labels |
| Content encryption | AES-256-GCM with 128-bit tag |
| Signatures | Ed25519 |
| Hashing | SHA-256 |
| Encoding | Deterministic CBOR |
| Randomness | Operating-system CSPRNG only |

Implementations must reject unsupported suites, parameters below the security
floor, truncated GCM tags, malformed deterministic encodings, reused state IDs,
and protocol downgrades.

References:

- [Argon2id — RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html)
- [HKDF — RFC 5869](https://www.rfc-editor.org/rfc/rfc5869.html)
- [AEAD requirements — RFC 5116](https://www.rfc-editor.org/rfc/rfc5116.html)
- [Ed25519 — RFC 8032](https://www.rfc-editor.org/rfc/rfc8032.html)
- [Deterministic CBOR — RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html)
- [AES-GCM — NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [Key management — NIST SP 800-57 Part 1](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
