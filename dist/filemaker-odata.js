import Er, { isAxiosError as Lr } from "axios";
var F = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Ka(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var B, kr;
function Xa() {
  if (kr) return B;
  kr = 1;
  function t() {
    this.__data__ = [], this.size = 0;
  }
  return B = t, B;
}
var V, Hr;
function E() {
  if (Hr) return V;
  Hr = 1;
  function t(e, r) {
    return e === r || e !== e && r !== r;
  }
  return V = t, V;
}
var K, Gr;
function L() {
  if (Gr) return K;
  Gr = 1;
  var t = E();
  function e(r, a) {
    for (var n = r.length; n--; )
      if (t(r[n][0], a))
        return n;
    return -1;
  }
  return K = e, K;
}
var X, Ur;
function Ja() {
  if (Ur) return X;
  Ur = 1;
  var t = L(), e = Array.prototype, r = e.splice;
  function a(n) {
    var i = this.__data__, s = t(i, n);
    if (s < 0)
      return !1;
    var o = i.length - 1;
    return s == o ? i.pop() : r.call(i, s, 1), --this.size, !0;
  }
  return X = a, X;
}
var J, Nr;
function Wa() {
  if (Nr) return J;
  Nr = 1;
  var t = L();
  function e(r) {
    var a = this.__data__, n = t(a, r);
    return n < 0 ? void 0 : a[n][1];
  }
  return J = e, J;
}
var W, zr;
function Za() {
  if (zr) return W;
  zr = 1;
  var t = L();
  function e(r) {
    return t(this.__data__, r) > -1;
  }
  return W = e, W;
}
var Z, Br;
function Ya() {
  if (Br) return Z;
  Br = 1;
  var t = L();
  function e(r, a) {
    var n = this.__data__, i = t(n, r);
    return i < 0 ? (++this.size, n.push([r, a])) : n[i][1] = a, this;
  }
  return Z = e, Z;
}
var Y, Vr;
function k() {
  if (Vr) return Y;
  Vr = 1;
  var t = Xa(), e = Ja(), r = Wa(), a = Za(), n = Ya();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = t, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = a, i.prototype.set = n, Y = i, Y;
}
var Q, Kr;
function Qa() {
  if (Kr) return Q;
  Kr = 1;
  var t = k();
  function e() {
    this.__data__ = new t(), this.size = 0;
  }
  return Q = e, Q;
}
var ee, Xr;
function en() {
  if (Xr) return ee;
  Xr = 1;
  function t(e) {
    var r = this.__data__, a = r.delete(e);
    return this.size = r.size, a;
  }
  return ee = t, ee;
}
var re, Jr;
function rn() {
  if (Jr) return re;
  Jr = 1;
  function t(e) {
    return this.__data__.get(e);
  }
  return re = t, re;
}
var te, Wr;
function tn() {
  if (Wr) return te;
  Wr = 1;
  function t(e) {
    return this.__data__.has(e);
  }
  return te = t, te;
}
var ae, Zr;
function ja() {
  if (Zr) return ae;
  Zr = 1;
  var t = typeof F == "object" && F && F.Object === Object && F;
  return ae = t, ae;
}
var ne, Yr;
function $() {
  if (Yr) return ne;
  Yr = 1;
  var t = ja(), e = typeof self == "object" && self && self.Object === Object && self, r = t || e || Function("return this")();
  return ne = r, ne;
}
var ie, Qr;
function Sa() {
  if (Qr) return ie;
  Qr = 1;
  var t = $(), e = t.Symbol;
  return ie = e, ie;
}
var se, et;
function an() {
  if (et) return se;
  et = 1;
  var t = Sa(), e = Object.prototype, r = e.hasOwnProperty, a = e.toString, n = t ? t.toStringTag : void 0;
  function i(s) {
    var o = r.call(s, n), u = s[n];
    try {
      s[n] = void 0;
      var c = !0;
    } catch {
    }
    var h = a.call(s);
    return c && (o ? s[n] = u : delete s[n]), h;
  }
  return se = i, se;
}
var oe, rt;
function nn() {
  if (rt) return oe;
  rt = 1;
  var t = Object.prototype, e = t.toString;
  function r(a) {
    return e.call(a);
  }
  return oe = r, oe;
}
var ue, tt;
function H() {
  if (tt) return ue;
  tt = 1;
  var t = Sa(), e = an(), r = nn(), a = "[object Null]", n = "[object Undefined]", i = t ? t.toStringTag : void 0;
  function s(o) {
    return o == null ? o === void 0 ? n : a : i && i in Object(o) ? e(o) : r(o);
  }
  return ue = s, ue;
}
var ce, at;
function w() {
  if (at) return ce;
  at = 1;
  function t(e) {
    var r = typeof e;
    return e != null && (r == "object" || r == "function");
  }
  return ce = t, ce;
}
var he, nt;
function xr() {
  if (nt) return he;
  nt = 1;
  var t = H(), e = w(), r = "[object AsyncFunction]", a = "[object Function]", n = "[object GeneratorFunction]", i = "[object Proxy]";
  function s(o) {
    if (!e(o))
      return !1;
    var u = t(o);
    return u == a || u == n || u == r || u == i;
  }
  return he = s, he;
}
var fe, it;
function sn() {
  if (it) return fe;
  it = 1;
  var t = $(), e = t["__core-js_shared__"];
  return fe = e, fe;
}
var le, st;
function on() {
  if (st) return le;
  st = 1;
  var t = sn(), e = (function() {
    var a = /[^.]+$/.exec(t && t.keys && t.keys.IE_PROTO || "");
    return a ? "Symbol(src)_1." + a : "";
  })();
  function r(a) {
    return !!e && e in a;
  }
  return le = r, le;
}
var de, ot;
function un() {
  if (ot) return de;
  ot = 1;
  var t = Function.prototype, e = t.toString;
  function r(a) {
    if (a != null) {
      try {
        return e.call(a);
      } catch {
      }
      try {
        return a + "";
      } catch {
      }
    }
    return "";
  }
  return de = r, de;
}
var pe, ut;
function cn() {
  if (ut) return pe;
  ut = 1;
  var t = xr(), e = on(), r = w(), a = un(), n = /[\\^$.*+?()[\]{}|]/g, i = /^\[object .+?Constructor\]$/, s = Function.prototype, o = Object.prototype, u = s.toString, c = o.hasOwnProperty, h = RegExp(
    "^" + u.call(c).replace(n, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function l(d) {
    if (!r(d) || e(d))
      return !1;
    var _ = t(d) ? h : i;
    return _.test(a(d));
  }
  return pe = l, pe;
}
var ve, ct;
function hn() {
  if (ct) return ve;
  ct = 1;
  function t(e, r) {
    return e?.[r];
  }
  return ve = t, ve;
}
var ge, ht;
function Pr() {
  if (ht) return ge;
  ht = 1;
  var t = cn(), e = hn();
  function r(a, n) {
    var i = e(a, n);
    return t(i) ? i : void 0;
  }
  return ge = r, ge;
}
var _e, ft;
function xa() {
  if (ft) return _e;
  ft = 1;
  var t = Pr(), e = $(), r = t(e, "Map");
  return _e = r, _e;
}
var ye, lt;
function G() {
  if (lt) return ye;
  lt = 1;
  var t = Pr(), e = t(Object, "create");
  return ye = e, ye;
}
var be, dt;
function fn() {
  if (dt) return be;
  dt = 1;
  var t = G();
  function e() {
    this.__data__ = t ? t(null) : {}, this.size = 0;
  }
  return be = e, be;
}
var qe, pt;
function ln() {
  if (pt) return qe;
  pt = 1;
  function t(e) {
    var r = this.has(e) && delete this.__data__[e];
    return this.size -= r ? 1 : 0, r;
  }
  return qe = t, qe;
}
var Te, vt;
function dn() {
  if (vt) return Te;
  vt = 1;
  var t = G(), e = "__lodash_hash_undefined__", r = Object.prototype, a = r.hasOwnProperty;
  function n(i) {
    var s = this.__data__;
    if (t) {
      var o = s[i];
      return o === e ? void 0 : o;
    }
    return a.call(s, i) ? s[i] : void 0;
  }
  return Te = n, Te;
}
var Oe, gt;
function pn() {
  if (gt) return Oe;
  gt = 1;
  var t = G(), e = Object.prototype, r = e.hasOwnProperty;
  function a(n) {
    var i = this.__data__;
    return t ? i[n] !== void 0 : r.call(i, n);
  }
  return Oe = a, Oe;
}
var Re, _t;
function vn() {
  if (_t) return Re;
  _t = 1;
  var t = G(), e = "__lodash_hash_undefined__";
  function r(a, n) {
    var i = this.__data__;
    return this.size += this.has(a) ? 0 : 1, i[a] = t && n === void 0 ? e : n, this;
  }
  return Re = r, Re;
}
var Ce, yt;
function gn() {
  if (yt) return Ce;
  yt = 1;
  var t = fn(), e = ln(), r = dn(), a = pn(), n = vn();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = t, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = a, i.prototype.set = n, Ce = i, Ce;
}
var we, bt;
function _n() {
  if (bt) return we;
  bt = 1;
  var t = gn(), e = k(), r = xa();
  function a() {
    this.size = 0, this.__data__ = {
      hash: new t(),
      map: new (r || e)(),
      string: new t()
    };
  }
  return we = a, we;
}
var me, qt;
function yn() {
  if (qt) return me;
  qt = 1;
  function t(e) {
    var r = typeof e;
    return r == "string" || r == "number" || r == "symbol" || r == "boolean" ? e !== "__proto__" : e === null;
  }
  return me = t, me;
}
var $e, Tt;
function U() {
  if (Tt) return $e;
  Tt = 1;
  var t = yn();
  function e(r, a) {
    var n = r.__data__;
    return t(a) ? n[typeof a == "string" ? "string" : "hash"] : n.map;
  }
  return $e = e, $e;
}
var Ae, Ot;
function bn() {
  if (Ot) return Ae;
  Ot = 1;
  var t = U();
  function e(r) {
    var a = t(this, r).delete(r);
    return this.size -= a ? 1 : 0, a;
  }
  return Ae = e, Ae;
}
var Ie, Rt;
function qn() {
  if (Rt) return Ie;
  Rt = 1;
  var t = U();
  function e(r) {
    return t(this, r).get(r);
  }
  return Ie = e, Ie;
}
var je, Ct;
function Tn() {
  if (Ct) return je;
  Ct = 1;
  var t = U();
  function e(r) {
    return t(this, r).has(r);
  }
  return je = e, je;
}
var Se, wt;
function On() {
  if (wt) return Se;
  wt = 1;
  var t = U();
  function e(r, a) {
    var n = t(this, r), i = n.size;
    return n.set(r, a), this.size += n.size == i ? 0 : 1, this;
  }
  return Se = e, Se;
}
var xe, mt;
function Rn() {
  if (mt) return xe;
  mt = 1;
  var t = _n(), e = bn(), r = qn(), a = Tn(), n = On();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = t, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = a, i.prototype.set = n, xe = i, xe;
}
var Pe, $t;
function Cn() {
  if ($t) return Pe;
  $t = 1;
  var t = k(), e = xa(), r = Rn(), a = 200;
  function n(i, s) {
    var o = this.__data__;
    if (o instanceof t) {
      var u = o.__data__;
      if (!e || u.length < a - 1)
        return u.push([i, s]), this.size = ++o.size, this;
      o = this.__data__ = new r(u);
    }
    return o.set(i, s), this.size = o.size, this;
  }
  return Pe = n, Pe;
}
var Me, At;
function wn() {
  if (At) return Me;
  At = 1;
  var t = k(), e = Qa(), r = en(), a = rn(), n = tn(), i = Cn();
  function s(o) {
    var u = this.__data__ = new t(o);
    this.size = u.size;
  }
  return s.prototype.clear = e, s.prototype.delete = r, s.prototype.get = a, s.prototype.has = n, s.prototype.set = i, Me = s, Me;
}
var De, It;
function Pa() {
  if (It) return De;
  It = 1;
  var t = Pr(), e = (function() {
    try {
      var r = t(Object, "defineProperty");
      return r({}, "", {}), r;
    } catch {
    }
  })();
  return De = e, De;
}
var Fe, jt;
function Mr() {
  if (jt) return Fe;
  jt = 1;
  var t = Pa();
  function e(r, a, n) {
    a == "__proto__" && t ? t(r, a, {
      configurable: !0,
      enumerable: !0,
      value: n,
      writable: !0
    }) : r[a] = n;
  }
  return Fe = e, Fe;
}
var Ee, St;
function Ma() {
  if (St) return Ee;
  St = 1;
  var t = Mr(), e = E();
  function r(a, n, i) {
    (i !== void 0 && !e(a[n], i) || i === void 0 && !(n in a)) && t(a, n, i);
  }
  return Ee = r, Ee;
}
var Le, xt;
function mn() {
  if (xt) return Le;
  xt = 1;
  function t(e) {
    return function(r, a, n) {
      for (var i = -1, s = Object(r), o = n(r), u = o.length; u--; ) {
        var c = o[e ? u : ++i];
        if (a(s[c], c, s) === !1)
          break;
      }
      return r;
    };
  }
  return Le = t, Le;
}
var ke, Pt;
function $n() {
  if (Pt) return ke;
  Pt = 1;
  var t = mn(), e = t();
  return ke = e, ke;
}
var j = { exports: {} };
j.exports;
var Mt;
function An() {
  return Mt || (Mt = 1, (function(t, e) {
    var r = $(), a = e && !e.nodeType && e, n = a && !0 && t && !t.nodeType && t, i = n && n.exports === a, s = i ? r.Buffer : void 0, o = s ? s.allocUnsafe : void 0;
    function u(c, h) {
      if (h)
        return c.slice();
      var l = c.length, d = o ? o(l) : new c.constructor(l);
      return c.copy(d), d;
    }
    t.exports = u;
  })(j, j.exports)), j.exports;
}
var He, Dt;
function In() {
  if (Dt) return He;
  Dt = 1;
  var t = $(), e = t.Uint8Array;
  return He = e, He;
}
var Ge, Ft;
function jn() {
  if (Ft) return Ge;
  Ft = 1;
  var t = In();
  function e(r) {
    var a = new r.constructor(r.byteLength);
    return new t(a).set(new t(r)), a;
  }
  return Ge = e, Ge;
}
var Ue, Et;
function Sn() {
  if (Et) return Ue;
  Et = 1;
  var t = jn();
  function e(r, a) {
    var n = a ? t(r.buffer) : r.buffer;
    return new r.constructor(n, r.byteOffset, r.length);
  }
  return Ue = e, Ue;
}
var Ne, Lt;
function xn() {
  if (Lt) return Ne;
  Lt = 1;
  function t(e, r) {
    var a = -1, n = e.length;
    for (r || (r = Array(n)); ++a < n; )
      r[a] = e[a];
    return r;
  }
  return Ne = t, Ne;
}
var ze, kt;
function Pn() {
  if (kt) return ze;
  kt = 1;
  var t = w(), e = Object.create, r = /* @__PURE__ */ (function() {
    function a() {
    }
    return function(n) {
      if (!t(n))
        return {};
      if (e)
        return e(n);
      a.prototype = n;
      var i = new a();
      return a.prototype = void 0, i;
    };
  })();
  return ze = r, ze;
}
var Be, Ht;
function Mn() {
  if (Ht) return Be;
  Ht = 1;
  function t(e, r) {
    return function(a) {
      return e(r(a));
    };
  }
  return Be = t, Be;
}
var Ve, Gt;
function Da() {
  if (Gt) return Ve;
  Gt = 1;
  var t = Mn(), e = t(Object.getPrototypeOf, Object);
  return Ve = e, Ve;
}
var Ke, Ut;
function Fa() {
  if (Ut) return Ke;
  Ut = 1;
  var t = Object.prototype;
  function e(r) {
    var a = r && r.constructor, n = typeof a == "function" && a.prototype || t;
    return r === n;
  }
  return Ke = e, Ke;
}
var Xe, Nt;
function Dn() {
  if (Nt) return Xe;
  Nt = 1;
  var t = Pn(), e = Da(), r = Fa();
  function a(n) {
    return typeof n.constructor == "function" && !r(n) ? t(e(n)) : {};
  }
  return Xe = a, Xe;
}
var Je, zt;
function M() {
  if (zt) return Je;
  zt = 1;
  function t(e) {
    return e != null && typeof e == "object";
  }
  return Je = t, Je;
}
var We, Bt;
function Fn() {
  if (Bt) return We;
  Bt = 1;
  var t = H(), e = M(), r = "[object Arguments]";
  function a(n) {
    return e(n) && t(n) == r;
  }
  return We = a, We;
}
var Ze, Vt;
function Ea() {
  if (Vt) return Ze;
  Vt = 1;
  var t = Fn(), e = M(), r = Object.prototype, a = r.hasOwnProperty, n = r.propertyIsEnumerable, i = t(/* @__PURE__ */ (function() {
    return arguments;
  })()) ? t : function(s) {
    return e(s) && a.call(s, "callee") && !n.call(s, "callee");
  };
  return Ze = i, Ze;
}
var Ye, Kt;
function La() {
  if (Kt) return Ye;
  Kt = 1;
  var t = Array.isArray;
  return Ye = t, Ye;
}
var Qe, Xt;
function ka() {
  if (Xt) return Qe;
  Xt = 1;
  var t = 9007199254740991;
  function e(r) {
    return typeof r == "number" && r > -1 && r % 1 == 0 && r <= t;
  }
  return Qe = e, Qe;
}
var er, Jt;
function Dr() {
  if (Jt) return er;
  Jt = 1;
  var t = xr(), e = ka();
  function r(a) {
    return a != null && e(a.length) && !t(a);
  }
  return er = r, er;
}
var rr, Wt;
function En() {
  if (Wt) return rr;
  Wt = 1;
  var t = Dr(), e = M();
  function r(a) {
    return e(a) && t(a);
  }
  return rr = r, rr;
}
var S = { exports: {} }, tr, Zt;
function Ln() {
  if (Zt) return tr;
  Zt = 1;
  function t() {
    return !1;
  }
  return tr = t, tr;
}
S.exports;
var Yt;
function Ha() {
  return Yt || (Yt = 1, (function(t, e) {
    var r = $(), a = Ln(), n = e && !e.nodeType && e, i = n && !0 && t && !t.nodeType && t, s = i && i.exports === n, o = s ? r.Buffer : void 0, u = o ? o.isBuffer : void 0, c = u || a;
    t.exports = c;
  })(S, S.exports)), S.exports;
}
var ar, Qt;
function kn() {
  if (Qt) return ar;
  Qt = 1;
  var t = H(), e = Da(), r = M(), a = "[object Object]", n = Function.prototype, i = Object.prototype, s = n.toString, o = i.hasOwnProperty, u = s.call(Object);
  function c(h) {
    if (!r(h) || t(h) != a)
      return !1;
    var l = e(h);
    if (l === null)
      return !0;
    var d = o.call(l, "constructor") && l.constructor;
    return typeof d == "function" && d instanceof d && s.call(d) == u;
  }
  return ar = c, ar;
}
var nr, ea;
function Hn() {
  if (ea) return nr;
  ea = 1;
  var t = H(), e = ka(), r = M(), a = "[object Arguments]", n = "[object Array]", i = "[object Boolean]", s = "[object Date]", o = "[object Error]", u = "[object Function]", c = "[object Map]", h = "[object Number]", l = "[object Object]", d = "[object RegExp]", _ = "[object Set]", b = "[object String]", q = "[object WeakMap]", T = "[object ArrayBuffer]", m = "[object DataView]", p = "[object Float32Array]", N = "[object Float64Array]", z = "[object Int8Array]", A = "[object Int16Array]", R = "[object Int32Array]", y = "[object Uint8Array]", v = "[object Uint8ClampedArray]", D = "[object Uint16Array]", g = "[object Uint32Array]", f = {};
  f[p] = f[N] = f[z] = f[A] = f[R] = f[y] = f[v] = f[D] = f[g] = !0, f[a] = f[n] = f[T] = f[i] = f[m] = f[s] = f[o] = f[u] = f[c] = f[h] = f[l] = f[d] = f[_] = f[b] = f[q] = !1;
  function I(C) {
    return r(C) && e(C.length) && !!f[t(C)];
  }
  return nr = I, nr;
}
var ir, ra;
function Gn() {
  if (ra) return ir;
  ra = 1;
  function t(e) {
    return function(r) {
      return e(r);
    };
  }
  return ir = t, ir;
}
var x = { exports: {} };
x.exports;
var ta;
function Un() {
  return ta || (ta = 1, (function(t, e) {
    var r = ja(), a = e && !e.nodeType && e, n = a && !0 && t && !t.nodeType && t, i = n && n.exports === a, s = i && r.process, o = (function() {
      try {
        var u = n && n.require && n.require("util").types;
        return u || s && s.binding && s.binding("util");
      } catch {
      }
    })();
    t.exports = o;
  })(x, x.exports)), x.exports;
}
var sr, aa;
function Ga() {
  if (aa) return sr;
  aa = 1;
  var t = Hn(), e = Gn(), r = Un(), a = r && r.isTypedArray, n = a ? e(a) : t;
  return sr = n, sr;
}
var or, na;
function Ua() {
  if (na) return or;
  na = 1;
  function t(e, r) {
    if (!(r === "constructor" && typeof e[r] == "function") && r != "__proto__")
      return e[r];
  }
  return or = t, or;
}
var ur, ia;
function Nn() {
  if (ia) return ur;
  ia = 1;
  var t = Mr(), e = E(), r = Object.prototype, a = r.hasOwnProperty;
  function n(i, s, o) {
    var u = i[s];
    (!(a.call(i, s) && e(u, o)) || o === void 0 && !(s in i)) && t(i, s, o);
  }
  return ur = n, ur;
}
var cr, sa;
function zn() {
  if (sa) return cr;
  sa = 1;
  var t = Nn(), e = Mr();
  function r(a, n, i, s) {
    var o = !i;
    i || (i = {});
    for (var u = -1, c = n.length; ++u < c; ) {
      var h = n[u], l = s ? s(i[h], a[h], h, i, a) : void 0;
      l === void 0 && (l = a[h]), o ? e(i, h, l) : t(i, h, l);
    }
    return i;
  }
  return cr = r, cr;
}
var hr, oa;
function Bn() {
  if (oa) return hr;
  oa = 1;
  function t(e, r) {
    for (var a = -1, n = Array(e); ++a < e; )
      n[a] = r(a);
    return n;
  }
  return hr = t, hr;
}
var fr, ua;
function Na() {
  if (ua) return fr;
  ua = 1;
  var t = 9007199254740991, e = /^(?:0|[1-9]\d*)$/;
  function r(a, n) {
    var i = typeof a;
    return n = n ?? t, !!n && (i == "number" || i != "symbol" && e.test(a)) && a > -1 && a % 1 == 0 && a < n;
  }
  return fr = r, fr;
}
var lr, ca;
function Vn() {
  if (ca) return lr;
  ca = 1;
  var t = Bn(), e = Ea(), r = La(), a = Ha(), n = Na(), i = Ga(), s = Object.prototype, o = s.hasOwnProperty;
  function u(c, h) {
    var l = r(c), d = !l && e(c), _ = !l && !d && a(c), b = !l && !d && !_ && i(c), q = l || d || _ || b, T = q ? t(c.length, String) : [], m = T.length;
    for (var p in c)
      (h || o.call(c, p)) && !(q && // Safari 9 has enumerable `arguments.length` in strict mode.
      (p == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      _ && (p == "offset" || p == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      b && (p == "buffer" || p == "byteLength" || p == "byteOffset") || // Skip index properties.
      n(p, m))) && T.push(p);
    return T;
  }
  return lr = u, lr;
}
var dr, ha;
function Kn() {
  if (ha) return dr;
  ha = 1;
  function t(e) {
    var r = [];
    if (e != null)
      for (var a in Object(e))
        r.push(a);
    return r;
  }
  return dr = t, dr;
}
var pr, fa;
function Xn() {
  if (fa) return pr;
  fa = 1;
  var t = w(), e = Fa(), r = Kn(), a = Object.prototype, n = a.hasOwnProperty;
  function i(s) {
    if (!t(s))
      return r(s);
    var o = e(s), u = [];
    for (var c in s)
      c == "constructor" && (o || !n.call(s, c)) || u.push(c);
    return u;
  }
  return pr = i, pr;
}
var vr, la;
function za() {
  if (la) return vr;
  la = 1;
  var t = Vn(), e = Xn(), r = Dr();
  function a(n) {
    return r(n) ? t(n, !0) : e(n);
  }
  return vr = a, vr;
}
var gr, da;
function Jn() {
  if (da) return gr;
  da = 1;
  var t = zn(), e = za();
  function r(a) {
    return t(a, e(a));
  }
  return gr = r, gr;
}
var _r, pa;
function Wn() {
  if (pa) return _r;
  pa = 1;
  var t = Ma(), e = An(), r = Sn(), a = xn(), n = Dn(), i = Ea(), s = La(), o = En(), u = Ha(), c = xr(), h = w(), l = kn(), d = Ga(), _ = Ua(), b = Jn();
  function q(T, m, p, N, z, A, R) {
    var y = _(T, p), v = _(m, p), D = R.get(v);
    if (D) {
      t(T, p, D);
      return;
    }
    var g = A ? A(y, v, p + "", T, m, R) : void 0, f = g === void 0;
    if (f) {
      var I = s(v), C = !I && u(v), Fr = !I && !C && d(v);
      g = v, I || C || Fr ? s(y) ? g = y : o(y) ? g = a(y) : C ? (f = !1, g = e(v, !0)) : Fr ? (f = !1, g = r(v, !0)) : g = [] : l(v) || i(v) ? (g = y, i(y) ? g = b(y) : (!h(y) || c(y)) && (g = n(v))) : f = !1;
    }
    f && (R.set(v, g), z(g, v, N, A, R), R.delete(v)), t(T, p, g);
  }
  return _r = q, _r;
}
var yr, va;
function Zn() {
  if (va) return yr;
  va = 1;
  var t = wn(), e = Ma(), r = $n(), a = Wn(), n = w(), i = za(), s = Ua();
  function o(u, c, h, l, d) {
    u !== c && r(c, function(_, b) {
      if (d || (d = new t()), n(_))
        a(u, c, b, h, o, l, d);
      else {
        var q = l ? l(s(u, b), _, b + "", u, c, d) : void 0;
        q === void 0 && (q = _), e(u, b, q);
      }
    }, i);
  }
  return yr = o, yr;
}
var br, ga;
function Ba() {
  if (ga) return br;
  ga = 1;
  function t(e) {
    return e;
  }
  return br = t, br;
}
var qr, _a;
function Yn() {
  if (_a) return qr;
  _a = 1;
  function t(e, r, a) {
    switch (a.length) {
      case 0:
        return e.call(r);
      case 1:
        return e.call(r, a[0]);
      case 2:
        return e.call(r, a[0], a[1]);
      case 3:
        return e.call(r, a[0], a[1], a[2]);
    }
    return e.apply(r, a);
  }
  return qr = t, qr;
}
var Tr, ya;
function Qn() {
  if (ya) return Tr;
  ya = 1;
  var t = Yn(), e = Math.max;
  function r(a, n, i) {
    return n = e(n === void 0 ? a.length - 1 : n, 0), function() {
      for (var s = arguments, o = -1, u = e(s.length - n, 0), c = Array(u); ++o < u; )
        c[o] = s[n + o];
      o = -1;
      for (var h = Array(n + 1); ++o < n; )
        h[o] = s[o];
      return h[n] = i(c), t(a, this, h);
    };
  }
  return Tr = r, Tr;
}
var Or, ba;
function ei() {
  if (ba) return Or;
  ba = 1;
  function t(e) {
    return function() {
      return e;
    };
  }
  return Or = t, Or;
}
var Rr, qa;
function ri() {
  if (qa) return Rr;
  qa = 1;
  var t = ei(), e = Pa(), r = Ba(), a = e ? function(n, i) {
    return e(n, "toString", {
      configurable: !0,
      enumerable: !1,
      value: t(i),
      writable: !0
    });
  } : r;
  return Rr = a, Rr;
}
var Cr, Ta;
function ti() {
  if (Ta) return Cr;
  Ta = 1;
  var t = 800, e = 16, r = Date.now;
  function a(n) {
    var i = 0, s = 0;
    return function() {
      var o = r(), u = e - (o - s);
      if (s = o, u > 0) {
        if (++i >= t)
          return arguments[0];
      } else
        i = 0;
      return n.apply(void 0, arguments);
    };
  }
  return Cr = a, Cr;
}
var wr, Oa;
function ai() {
  if (Oa) return wr;
  Oa = 1;
  var t = ri(), e = ti(), r = e(t);
  return wr = r, wr;
}
var mr, Ra;
function ni() {
  if (Ra) return mr;
  Ra = 1;
  var t = Ba(), e = Qn(), r = ai();
  function a(n, i) {
    return r(e(n, i, t), n + "");
  }
  return mr = a, mr;
}
var $r, Ca;
function ii() {
  if (Ca) return $r;
  Ca = 1;
  var t = E(), e = Dr(), r = Na(), a = w();
  function n(i, s, o) {
    if (!a(o))
      return !1;
    var u = typeof s;
    return (u == "number" ? e(o) && r(s, o.length) : u == "string" && s in o) ? t(o[s], i) : !1;
  }
  return $r = n, $r;
}
var Ar, wa;
function si() {
  if (wa) return Ar;
  wa = 1;
  var t = ni(), e = ii();
  function r(a) {
    return t(function(n, i) {
      var s = -1, o = i.length, u = o > 1 ? i[o - 1] : void 0, c = o > 2 ? i[2] : void 0;
      for (u = a.length > 3 && typeof u == "function" ? (o--, u) : void 0, c && e(i[0], i[1], c) && (u = o < 3 ? void 0 : u, o = 1), n = Object(n); ++s < o; ) {
        var h = i[s];
        h && a(n, h, s, u);
      }
      return n;
    });
  }
  return Ar = r, Ar;
}
var Ir, ma;
function oi() {
  if (ma) return Ir;
  ma = 1;
  var t = Zn(), e = si(), r = e(function(a, n, i) {
    t(a, n, i);
  });
  return Ir = r, Ir;
}
var ui = oi();
const $a = /* @__PURE__ */ Ka(ui);
class jr extends Error {
  data;
  constructor(e, r) {
    super(e), this.name = "RequestError", this.data = r;
  }
}
const O = (t) => t instanceof jr;
class P {
  credentials;
  agent;
  constructor(e, r) {
    this.credentials = e, this.agent = r;
  }
  async get(e, r) {
    try {
      return await Er.get(
        e,
        $a(
          { ...r },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
      );
    } catch (a) {
      throw new jr(
        a instanceof Error ? a.message : String(a),
        Lr(a) && a.response ? a.response.data : void 0
      );
    }
  }
  async post(e, r, a) {
    try {
      return await Er.post(
        e,
        r,
        $a(
          { ...a },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
      );
    } catch (n) {
      throw new jr(
        n instanceof Error ? n.message : String(n),
        Lr(n) && n.response ? n.response.data : void 0
      );
    }
  }
}
class Sr {
  get authorizationHeaders() {
    return {};
  }
}
class ci {
  requestId;
  identifier;
  constructor({
    requestId: e,
    identifier: r
  }) {
    this.requestId = e, this.identifier = r;
  }
  get authorizationHeaders() {
    return {
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      "X-FM-Data-OAuth-Request-Id": this.requestId,
      "X-FM-Data-OAuth-Identifier": this.identifier
    };
  }
}
class hi {
  username;
  password;
  constructor({ username: e, password: r }) {
    this.username = e, this.password = r;
  }
  get authorizationHeaders() {
    return {
      Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`
    };
  }
}
class mi {
  authorization;
  constructor(e) {
    this.authorization = e;
  }
  get authorizationHeaders() {
    return {
      Authorization: this.authorization
    };
  }
}
class $i {
  server;
  database;
  request;
  constructor({ server: e, database: r }) {
    this.server = e, this.database = r, this.request = new P(new Sr());
  }
  url(e) {
    return `https://${this.server}/fmi/data/vLatest/databases/${this.database}/${e}`;
  }
  async getAuthType() {
    const r = (await this.request.get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return r !== void 0 ? r.Provider[0].Name : "basic";
  }
  async getOAuthUrl({
    trackingId: e,
    provider: r,
    returnUrl: a
  }) {
    const n = `https://${this.server}/oauth/getoauthurl?trackingID=${e}&provider=${r}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    console.log(n), console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": a ?? `https://${this.server}/oauth-handler`
      }
    });
    const i = await this.request.get(n, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": a ?? `https://${this.server}/oauth-handler`
      }
    }), s = i.data, o = i.headers["x-fms-request-id"] ?? "";
    if (o === void 0 || o === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: s, requestId: o };
  }
  // Uses a requestId and an identifier (OAuth) to return an authentication
  // token which can be used for subsequent requests.
  async getTokenUsingOAuth({
    requestId: e,
    identifier: r
  }) {
    return (await this.request.post(this.url("sessions"), {
      headers: {
        "Content-Type": "application/json",
        "X-FM-Data-OAuth-Request-Id": e,
        "X-FM-Data-OAuth-Identifier": r
      }
    })).headers["X-FM-Data-Access-Token"];
  }
  /**
   * Uses the given credentials to return an authentication token which can be
  /* used for subsequent requests.
   */
  async getTokenUsingCredentials({
    username: e,
    password: r
  }) {
    return (await this.request.post(
      this.url("sessions"),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${e}:${r}`)}`
        }
      }
    )).data.response.token ?? null;
  }
}
class fi {
  config;
  table;
  record;
  constructor({
    config: e,
    table: r,
    record: a
  }) {
    this.config = e, this.table = r, this.record = a;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    const { ID: a, ...n } = this.record, i = JSON.stringify(n);
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(i)}\r
\r
` + i + `\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const a = Number(r[1]);
    if (a >= 300) {
      const { error: i } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${i.message}`);
    }
    const n = JSON.parse(e.substring(e.indexOf("{")).trim());
    return { status: a, body: n };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  byteLength(e) {
    return new TextEncoder().encode(e).byteLength;
  }
}
class li {
  config;
  table;
  record;
  constructor({
    config: e,
    table: r,
    record: a
  }) {
    this.config = e, this.table = r, this.record = a;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    const a = JSON.stringify(this.record);
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
POST ${this.url(this.table)} HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(a)}\r
\r
` + a + `\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const a = Number(r[1]);
    if (a >= 300) {
      const { error: n } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[CREATE OPERATION: ${this.table}] ${n.message}`);
    }
    return { status: a, body: null };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  byteLength(e) {
    return new TextEncoder().encode(e).byteLength;
  }
}
class di {
  config;
  table;
  id;
  constructor({
    config: e,
    table: r,
    id: a
  }) {
    this.config = e, this.table = r, this.id = a;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
DELETE ${this.url(this.table)}('${this.id}') HTTP/1.1\r
\r
\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const a = Number(r[1]);
    if (a >= 300) {
      const { error: n } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[DELETE OPERATION: ${this.table}] ${n.message}`);
    }
    return { status: a, body: null };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
}
class pi {
  operations;
  callback;
  config;
  constructor(e, r) {
    this.config = e, this.callback = r, this.operations = [];
  }
  update({
    table: e,
    record: r
  }) {
    return this.operations.push(
      new fi({
        config: this.config,
        table: e,
        record: r
      })
    ), this;
  }
  create({ table: e, record: r }) {
    return this.operations.push(
      new li({
        config: this.config,
        table: e,
        record: r
      })
    ), this;
  }
  delete({ table: e, id: r }) {
    return this.operations.push(
      new di({
        config: this.config,
        table: e,
        id: r
      })
    ), this;
  }
  execute() {
    return this.callback(this.operations);
  }
}
const Aa = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t) => {
  const e = Math.random() * 16 | 0;
  return (t == "x" ? e : e & 3 | 8).toString(16);
});
class Ia {
  config;
  logger;
  request;
  constructor({
    server: e,
    database: r,
    logger: a,
    request: n
  }) {
    this.config = { server: e, database: r }, this.logger = a, this.request = n;
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  async metadata() {
    return (await this.request.get(this.url("$metadata"))).data;
  }
  async subquery(e) {
    this.log(`[FileMaker] Get records from ${e.table}`), this.log("Options:"), this.log(e.options), this.log(
      `URL: ${this.url(`${e.table}('${e.recordId}')/${e.path}`)}?${this.parameterize(e.options)}`
    );
    try {
      return (await this.request.get(
        `${this.url(`${e.table}('${e.recordId}')/${e.path}`)}?${this.parameterize(e.options)}`
      )).data.value;
    } catch (r) {
      throw O(r) && (this.log("[FileMaker] subquery: HTTP error"), this.log(r.data)), r;
    }
  }
  async getRecords(e, r) {
    this.log(`[FileMaker] Get records from ${e}`), this.log("Options:"), this.log(r), this.log(`URL: ${this.url(e)}?${this.parameterize(r)}`);
    try {
      return (await this.request.get(`${this.url(e)}?${this.parameterize(r)}`)).data.value;
    } catch (a) {
      throw O(a) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(a.data)), a;
    }
  }
  async getRecordsWithCount(e, r) {
    this.log(`[FileMaker] Get records with count from ${e}`), this.log("Options:"), this.log(r);
    const a = { ...r, $count: !0 };
    this.log(`URL: ${this.url(e)}?${this.parameterize(a)}`);
    try {
      const n = await this.request.get(`${this.url(e)}?${this.parameterize(a)}`);
      return {
        data: n.data.value,
        count: n.data["@odata.count"] ?? 0
      };
    } catch (n) {
      throw O(n) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(n.data)), n;
    }
  }
  async getRecord(e, r, a) {
    this.log(`[FileMaker] Get record from ${e}`), this.log(`ID: ${r}`);
    try {
      const n = `${this.url(e)}('${encodeURIComponent(r)}')?${this.parameterize(a)}`;
      return this.log(`URL: ${n}`), (await this.request.get(n)).data;
    } catch (n) {
      throw O(n) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(n.data)), n;
    }
  }
  async getValue(e, r, a) {
    try {
      return (await this.request.get(
        `${this.url(e)}('${encodeURIComponent(r)}')/${encodeURIComponent(a)}/$value`,
        {
          responseType: "arraybuffer"
        }
      )).data;
    } catch (n) {
      throw O(n) && (this.log("[FileMaker] getValue: HTTP error"), this.log(n.data)), n;
    }
  }
  async crossjoin({
    tables: e,
    options: r
  }) {
    try {
      return (await this.request.get(
        `${this.url("$crossjoin")}(${e.join(",")})?${this.parameterize(r)}`
      )).data;
    } catch (a) {
      throw O(a) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(a.data)), a;
    }
  }
  // Performs a "$batch" request, executing the given operations
  // transactionally. Meaning operations either all succeed, or none of them
  // does.
  //
  // Usage:
  //
  //   const response = (await fm
  //     .batch()
  //     .update<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         ID: "FINDING-280DC895-23F6-4368-BE3B-3EA81D360F62",
  //         FINDING: "Example 1 2 3",
  //       },
  //     })
  //     .create<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         FINDING: "Example body",
  //       },
  //     })
  //     .delete({
  //       table: "FINDING",
  //       id: "SOME-FINDING-ID",
  //     })
  //     .execute()) as [
  //       BatchOperationResponse<FindingRecord>,
  //       BatchOperationResponse<null>,
  //       BatchOperationResponse<null>
  //     ];
  //
  batch() {
    return new pi(this.config, async (e) => {
      const r = `batch_${Aa()}`, a = `changeset_${Aa()}`, n = `--${r}\r
Content-Type: multipart/mixed; boundary=${a}\r
\r
` + e.map(
        (i, s) => i.toRequestBody({
          boundary: a,
          changeId: s + 1
        })
      ).join("") + `--${a}--\r
--${r}--\r
`;
      try {
        const i = await this.request.post(
          this.url("$batch"),
          n,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${r}`
            }
          }
        ), s = /boundary=(.+?)\r\n/.exec(i.data);
        if (s === null) throw new Error("Could not find changeset");
        const o = s[0].split("=")[1].trim();
        return i.data.split(`--${o}`).slice(1, -1).map(
          (c, h) => e[h].parseResponse(c)
        );
      } catch (i) {
        throw O(i) && (this.log("[FileMaker] batch: HTTP error"), this.log(i.data)), i;
      }
    });
  }
  async script(e, r) {
    this.log(`[FileMaker] Running script ${e} with parameters:`), this.log({ scriptParameterValue: r });
    try {
      const a = await this.request.post(
        this.url(`Script.${encodeURIComponent(e)}`),
        r === void 0 ? null : { scriptParameterValue: r },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      this.log(`[FileMaker] Script ${e} finished. Response:`), this.log(a.data);
      const n = a.data.scriptResult.code === 0;
      return {
        success: n,
        data: n ? a.data.scriptResult.resultParameter : void 0
      };
    } catch (a) {
      throw O(a) && (this.log("[FileMaker] script: HTTP error"), this.log(a.data)), a;
    }
  }
  parameterize(e) {
    if (e === void 0) return "$format=application/json";
    const r = {};
    if (e.$select !== void 0 && (r.$select = e.$select.map((n) => `"${String(n).replaceAll('"', '""')}"`).join(",")), e.$top !== void 0 && (r.$top = e.$top), e.$skip !== void 0 && (r.$skip = e.$skip), e.$filter !== void 0 && (r.$filter = e.$filter), e.$expand !== void 0 && (r.$expand = e.$expand), e.$orderby !== void 0) {
      const n = Array.isArray(e.$orderby[0]) ? e.$orderby : [e.$orderby];
      r.$orderby = n.map(([i, s]) => `"${String(i)}" ${s}`).join(",");
    }
    e.$count !== void 0 && (r.$count = e.$count ? "true" : "false");
    const a = e.$metadata ?? !0;
    return r.$format = `${e.$format === "xml" ? "application/xml" : "application/json"}${a ? "" : ";odata.metadata=none"}`, Object.entries(r).map(([n, i]) => `${n}=${i}`).join("&");
  }
  log(e) {
    return this.logger.log(e);
  }
}
class vi {
  log(e) {
    console.dir(e, { depth: null });
  }
}
class Ai {
  log() {
  }
}
class Ii {
  server;
  database;
  agent;
  logger;
  constructor({
    server: e,
    database: r,
    agent: a,
    logger: n
  }) {
    this.server = e, this.database = r, this.agent = a, this.logger = n ?? new vi();
  }
  /**
   * Creates a FileMaker instance configured with basic authentication.
   *
   * @param username - The FileMaker username
   * @param password - The FileMaker password
   * @returns A configured FileMaker instance ready to use
   */
  withBasicAuth({
    username: e,
    password: r
  }) {
    const a = new hi({ username: e, password: r }), n = new P(a, this.agent);
    return new Ia({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: n
    });
  }
  /**
   * Creates a FileMaker instance configured with OAuth credentials.
   *
   * @param requestId - The request ID obtained from getOAuthUrl()
   * @param identifier - The identifier received from the OAuth redirect
   * @returns A configured FileMaker instance ready to use
   */
  withOAuth({
    requestId: e,
    identifier: r
  }) {
    const a = new ci({
      requestId: e,
      identifier: r
    }), n = new P(a, this.agent);
    return new Ia({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: n
    });
  }
  /**
   * Initiates the OAuth authentication flow by generating the OAuth URL.
   * Redirect the user to the returned URL to begin authentication.
   *
   * @param trackingId - A unique identifier for tracking this OAuth request
   * @param provider - The OAuth provider name (e.g., "Google", "Microsoft")
   * @param returnUrl - Optional URL to return to after OAuth completes
   * @returns The OAuth redirect URL and request ID to store for later use
   */
  async getOAuthUrl({
    trackingId: e,
    provider: r,
    returnUrl: a
  }) {
    const n = new P(new Sr(), this.agent), i = `https://${this.server}/oauth/getoauthurl?trackingID=${e}&provider=${r}&address=${this.server}&X-FMS-OAuth-AuthType=2`, s = await n.get(i, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": a ?? `https://${this.server}/oauth-handler`
      }
    }), o = s.data, u = s.headers["x-fms-request-id"] ?? "";
    if (u === void 0 || u === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: o, requestId: u };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const a = (await new P(new Sr(), this.agent).get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return a !== void 0 ? a.Provider.map((n) => n.Name) : ["basic"];
  }
  /**
   * Helper method to construct a FileMaker OData URL.
   *
   * @param path - The path segment to append to the base URL
   * @returns The full OData URL
   */
  url(e) {
    return `https://${this.server}/fmi/odata/v4/${this.database}/${e}`;
  }
}
const gi = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/, _i = /^[+-]?\d+$/, yi = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, bi = /^[A-Za-z0-9 _-]+$/, Va = (t) => {
  if (typeof t != "string") throw new TypeError("Invalid OData string");
  return `'${t.replaceAll("'", "''")}'`;
}, qi = (t) => {
  if (typeof t == "number") {
    if (!Number.isFinite(t)) throw new TypeError("Invalid OData number");
    return String(t);
  }
  if (typeof t != "string")
    throw new TypeError("Invalid OData number");
  const e = t.trim();
  if (!gi.test(e))
    throw new TypeError("Invalid OData number");
  const r = Number(e);
  if (!Number.isFinite(r)) throw new TypeError("Invalid OData number");
  return e;
}, Ti = (t) => {
  if (typeof t != "number" && typeof t != "string")
    throw new TypeError("Invalid OData integer");
  const e = typeof t == "number" ? String(t) : t.trim();
  if (!_i.test(e))
    throw new TypeError("Invalid OData integer");
  return e;
}, Oi = (t) => {
  if (typeof t != "boolean") throw new TypeError("Invalid OData boolean");
  return t ? "true" : "false";
}, Ri = (t) => {
  if (typeof t != "string") throw new TypeError("Invalid OData UUID");
  if (!yi.test(t)) throw new TypeError("Invalid OData UUID");
  return Va(t);
}, Ci = (t) => {
  if (typeof t != "string")
    throw new TypeError("Invalid OData identifier");
  if (!bi.test(t))
    throw new TypeError("Invalid OData identifier");
  return `"${t}"`;
}, ji = {
  string: Va,
  number: qi,
  integer: Ti,
  boolean: Oi,
  uuid: Ri,
  identifier: Ci
};
export {
  Ia as FileMaker,
  $i as FileMakerAuthenticator,
  hi as FileMakerBasicCredentials,
  Ii as FileMakerClient,
  ci as FileMakerOAuthCredentials,
  mi as FileMakerRawCredentials,
  vi as Logger,
  Sr as NullFileMakerCredentials,
  Ai as NullLogger,
  ji as odata
};
