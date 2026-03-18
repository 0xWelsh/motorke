// src/app/portal/profile/page.js
import { requireDealer } from "@/lib/auth";

export const metadata = { title: "Profile — Motorke Portal" };

export default async function PortalProfilePage() {
  const user = await requireDealer();
  const dealer = user.dealer;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Dealership profile</h1>
        <p className="text-white/40 text-sm mt-1">
          This information appears on your public dealer page
        </p>
      </div>

      {/* Profile form */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7 mb-6">
        <h2 className="font-black mb-6">Public information</h2>
        <ProfileForm dealer={dealer} />
      </div>

      {/* Change password */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        <h2 className="font-black mb-6">Change password</h2>
        <PasswordForm userId={user.id} />
      </div>
    </div>
  );
}

function ProfileForm({ dealer }) {
  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <form action="/api/portal/profile" method="POST" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Dealership name</label>
          <input name="name" defaultValue={dealer?.name || ""}
            className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input name="phone" defaultValue={dealer?.phone || ""}
            placeholder="+254 7xx xxx xxx" className={inputCls} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>WhatsApp number</label>
          <input name="whatsapp" defaultValue={dealer?.whatsapp || ""}
            placeholder="254700000000" className={inputCls} />
          <p className="text-xs text-white/20 mt-1">Include country code, no +</p>
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input name="email" type="email" defaultValue={dealer?.email || ""}
            placeholder="sales@yourdealership.co.ke" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input name="location" defaultValue={dealer?.location || ""}
          placeholder="Westlands, Nairobi" className={inputCls} required />
      </div>

      <div>
        <label className={labelCls}>Full address</label>
        <input name="address" defaultValue={dealer?.address || ""}
          placeholder="Ring Road Westlands, opposite Sarit Centre" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>About your dealership</label>
        <textarea name="description" rows={4} defaultValue={dealer?.description || ""}
          placeholder="Tell buyers about your dealership — what you specialise in, how long you've been operating, what makes you different..."
          className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Website</label>
        <input name="website" type="url" defaultValue={dealer?.website || ""}
          placeholder="https://yourdealership.co.ke" className={inputCls} />
      </div>

      <button type="submit"
        className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
        Save changes
      </button>
    </form>
  );
}

function PasswordForm({ userId }) {
  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <form action="/api/portal/password" method="POST" className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label className={labelCls}>Current password</label>
        <input name="current" type="password" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>New password</label>
        <input name="newPassword" type="password" required minLength={8} className={inputCls} />
        <p className="text-xs text-white/20 mt-1">Minimum 8 characters</p>
      </div>
      <div>
        <label className={labelCls}>Confirm new password</label>
        <input name="confirm" type="password" required minLength={8} className={inputCls} />
      </div>
      <button type="submit"
        className="border border-white/20 hover:border-white/40 text-white/60 hover:text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
        Update password
      </button>
    </form>
  );
}
