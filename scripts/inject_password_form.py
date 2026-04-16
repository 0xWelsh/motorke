import re

path = 'src/app/portal/profile/page.js'
with open(path, 'r') as f:
    content = f.read()

password_form = """          </div>

          {/* Security & Password */}
          <div className="bg-white border border-[#ddd4c8] rounded-none p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Security & Password</h3>
            
            <form action="/api/profile/password" method="POST" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input name="password" type="password" minLength={6} className={inputCls} placeholder="Enter a secure password" required />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input name="confirm" type="password" minLength={6} className={inputCls} placeholder="Confirm your new password" required />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-[#111111] hover:bg-[#ff5a2f] text-white rounded-none px-6 py-2.5 font-bold text-[11px] uppercase font-black tracking-[0.15em] transition-none border border-transparent">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>"""

if "Security & Password" not in content:
    # Inject it right before the final `</div>\n    </div>\n  );\n}` block
    content = content.replace("          </div>\n        </div>\n    </div>\n  );\n}", password_form + "\n    </div>\n  );\n}")
    
    with open(path, 'w') as f:
        f.write(content)
    print("Password form injected.")
else:
    print("Form already exists.")
