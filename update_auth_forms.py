import re

def update_login():
    with open('src/components/LoginForm.js', 'r') as f:
        content = f.read()

    # Outer wrappers
    content = content.replace('className="min-h-screen bg-white"', 'className="min-h-screen bg-[#f7f6f3]"')
    content = content.replace('className="w-full max-w-md"', 'className="w-full max-w-md bg-white border border-[#ddd4c8] p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]"')
    
    # Typography
    content = content.replace('text-2xl font-bold text-slate-900', 'text-2xl font-black uppercase tracking-widest text-slate-900')
    content = content.replace('text-3xl font-bold text-slate-900', 'text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter')
    content = content.replace('text-sm text-slate-600', 'text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2')

    # Status boxes
    content = content.replace('bg-red-50 border border-red-200 rounded-lg', 'bg-[#111111] border border-red-500 rounded-none')
    content = content.replace('text-sm font-semibold text-red-900', 'text-[10px] font-black uppercase tracking-[0.15em] text-red-500')
    content = content.replace('text-sm text-red-700', 'text-[11px] font-bold text-red-400')

    # Labels and Inputs
    content = re.sub(r'className="block text-sm sm:text-sm font-semibold text-slate-900 mb-2"', r'className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 mb-2"', content)
    content = re.sub(r'className="w-full border border-slate-200 rounded-lg px-5 py-3\.5 sm:py-2\.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all(\s*.*?)"', r'className="w-full border border-[#ddd4c8] rounded-none bg-[#fbfcfe] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-none\1"', content)

    # Buttons
    content = re.sub(r'className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-3\.5 sm:py-2\.5 text-base sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"', r'className="w-full flex items-center justify-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white rounded-none px-5 py-4 text-xs font-black uppercase tracking-[0.15em] transition-none disabled:opacity-50 disabled:cursor-not-allowed"', content)
    content = content.replace('rounded-lg p-0.5', 'rounded-none p-0.5')
    content = content.replace('rounded-lg bg-green-500', 'rounded-none bg-emerald-500')

    # Links
    content = content.replace('text-sm font-medium text-slate-900 hover:underline', 'text-[10px] font-black uppercase tracking-[0.1em] text-slate-900 hover:text-[#ff5a2f] transition-colors')
    content = content.replace('text-slate-900 font-semibold hover:underline', 'text-slate-900 font-black hover:text-[#ff5a2f] transition-colors')

    with open('src/components/LoginForm.js', 'w') as f:
        f.write(content)

def update_signup():
    with open('src/components/SignupForm.js', 'r') as f:
        content = f.read()

    # Outer wrappers
    content = content.replace('className="min-h-screen bg-white"', 'className="min-h-screen bg-[#f7f6f3]"')
    content = content.replace('className="w-full max-w-md"', 'className="w-full max-w-md bg-white border border-[#ddd4c8] p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]"')
    
    # Typography
    content = content.replace('text-2xl font-bold text-slate-900', 'text-2xl font-black uppercase tracking-widest text-slate-900')
    content = content.replace('text-3xl font-bold text-slate-900 mb-2', 'text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2')
    content = content.replace('text-sm text-slate-600', 'text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2')

    # Status boxes
    content = content.replace('bg-red-50 border border-red-200 rounded-lg', 'bg-[#111111] border border-red-500 rounded-none')
    content = content.replace('text-sm font-semibold text-red-900', 'text-[10px] font-black uppercase tracking-[0.15em] text-red-500')
    
    # Account Tabs
    content = content.replace('bg-slate-100 p-1 rounded-lg', 'bg-[#fbfcfe] p-1 rounded-none border border-[#ddd4c8]')
    content = content.replace('rounded-md text-sm sm:text-sm font-medium transition-all duration-200 ease-out', 'rounded-none text-[10px] uppercase tracking-[0.15em] font-black transition-none duration-none ease-none')
    content = content.replace('bg-white text-slate-900 shadow-sm border border-slate-200/50', 'bg-[#111111] text-white border-transparent')
    content = content.replace('text-slate-500 hover:text-slate-700', 'text-slate-500 hover:text-slate-900')

    # Labels and Inputs
    content = re.sub(r'className="block text-sm sm:text-sm font-semibold text-slate-900 mb-2"', r'className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 mb-2"', content)
    content = re.sub(r'className="w-full border border-slate-200 rounded-lg px-5 py-3\.5 sm:py-2\.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all( pr-10)?"', r'className="w-full border border-[#ddd4c8] rounded-none bg-[#fbfcfe] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-none\1"', content)

    # Password strength blocks
    content = content.replace('rounded-full', 'rounded-none')

    # Buttons
    content = re.sub(r'className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-3\.5 sm:py-2\.5 text-base sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"', r'className="w-full flex items-center justify-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white rounded-none px-5 py-4 text-xs font-black uppercase tracking-[0.15em] transition-none disabled:opacity-50 disabled:cursor-not-allowed"', content)
    
    # Links
    content = content.replace('text-slate-900 font-semibold hover:underline', 'text-slate-900 font-black hover:text-[#ff5a2f] transition-colors')

    with open('src/components/SignupForm.js', 'w') as f:
        f.write(content)

update_login()
update_signup()
