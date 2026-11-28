"""Render one frame of the docs' point-cloud sample as a theme-neutral thumbnail (transparent background).

The 3D card on Tactile representation uses frame 94 from the camera view:
  python3 doc/_src/tools/rep3d_thumb.py doc/assets/data/isaac-aloha out.png 94
then crop to the bounding box and save as doc/assets/img/rep-3d-points.webp. Needs NumPy and Matplotlib."""
import json, sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import cm

root, out, frame = sys.argv[1], sys.argv[2], int(sys.argv[3])
meta = json.load(open(root + ".json"))
buf = open(root + ".bin", "rb").read()
F, P, T = meta["frames"], meta["nPc"], meta["nTac"]
U, O = meta["unit"], np.array(meta["origin"])
off = 0
cam = np.frombuffer(buf, "<u2", F * P * 3, off).reshape(F, P, 3); off += F * P * 3 * 2
tac = np.frombuffer(buf, "<u2", F * T * 3, off).reshape(F, T, 3); off += F * T * 3 * 2
rd = np.frombuffer(buf, "u1", F * T, off).reshape(F, T)
rmax = max(1, int(rd.max()))
c = meta["camera"]; pos, tgt = np.array(c["pos"]), np.array(c["target"])
d = pos - tgt; dist = np.linalg.norm(d); yaw = np.arctan2(d[1], d[0]); pitch = np.arcsin(d[2] / dist)
# a slightly higher, turned view than the camera's, like the viewer poster
yaw += float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
pitch += float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
e = tgt + dist * np.array([np.cos(pitch) * np.cos(yaw), np.cos(pitch) * np.sin(yaw), np.sin(pitch)])
f = tgt - e; f /= np.linalg.norm(f)
r = np.array([f[1], -f[0], 0.0]); r /= np.linalg.norm(r)
u = np.cross(r, f)

def project(a):
    w = O + a.astype(np.float64) * U - e
    z = w @ f
    return w @ r / z, w @ u / z, z

xs, ys, zs, cols, sizes = [], [], [], [], []
x, y, z = project(cam[frame]); xs += [x]; ys += [y]; zs += [z]
cols += [np.tile([0.54, 0.58, 0.64, 0.85], (P, 1))]; sizes += [np.full(P, 9.0)]
x, y, z = project(tac[frame]); xs += [x]; ys += [y]; zs += [z]
v = rd[frame] / rmax
tc = cm.viridis(np.clip(v, 0, 1)); tc[:, 3] = np.where(v > 0.02, 1.0, 0.6)
cols += [tc]; sizes += [np.where(v > 0.02, 9 + 14 * v, 4.5)]
X, Y, Z, C, S_ = map(np.concatenate, (xs, ys, zs, cols, sizes))
order = np.argsort(-Z)
fig = plt.figure(figsize=(4, 2.6), dpi=200)
ax = fig.add_axes([0, 0, 1, 1]); ax.set_axis_off()
ax.scatter(X[order], Y[order], s=S_[order], c=C[order], linewidths=0)
ax.set_aspect("equal"); ax.margins(0.04)
fig.savefig(out, transparent=True)
print("saved", out)
