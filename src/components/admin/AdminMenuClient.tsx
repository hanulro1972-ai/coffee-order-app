'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PlusIcon, Trash2Icon, UploadCloudIcon, ImageIcon, XIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMenuClient({ initialMenus }: { initialMenus: Menu[] }) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Drag and Drop & Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('COFFEE');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [imageUrl, setImageUrl] = useState('');

  const supabase = createClient();

  const toggleSoldOut = async (menu: Menu) => {
    const newStatus = !menu.is_sold_out;
    const { error } = await supabase
      .from('menus')
      .update({ is_sold_out: newStatus })
      .eq('id', menu.id);

    if (!error) {
      setMenus(menus.map(m => m.id === menu.id ? { ...m, is_sold_out: newStatus } : m));
      toast.success(`${menu.name} 품절 상태가 변경되었습니다.`);
    } else {
      toast.error('상태 변경 실패');
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일(PNG, JPG, WEBP 등)만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      // Supabase Storage 업로드 시도
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { upsert: true });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path);
        setImageUrl(urlData.publicUrl);
        toast.success('이미지 파일이 성공적으로 업로드되었습니다.');
      } else {
        // Storage 실패 시 Data URL 변환 적용
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setImageUrl(result);
            toast.success('이미지 파일이 첨부되었습니다.');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImageUrl(result);
          toast.success('이미지 파일이 첨부되었습니다.');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('메뉴명을 입력해 주세요.');
      return;
    }
    if (!price || parseInt(price, 10) <= 0) {
      toast.error('올바른 가격을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const newMenuPayload = {
      name: name.trim(),
      category: category.trim() || 'COFFEE',
      price: parseInt(price, 10),
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      is_sold_out: false,
      image_url: imageUrl.trim() || null,
    };

    const { data, error } = await supabase
      .from('menus')
      .insert(newMenuPayload)
      .select()
      .single();

    if (error) {
      toast.error(`메뉴 추가 실패: ${error.message}`);
    } else if (data) {
      setMenus((prev) => [data, ...prev]);
      toast.success(`'${data.name}' 메뉴가 추가되었습니다.`);
      setIsAddModalOpen(false);

      // Reset form
      setName('');
      setCategory('COFFEE');
      setPrice('');
      setStockQuantity('100');
      setImageUrl('');
    }
    setSubmitting(false);
  };

  const handleDeleteMenu = async (menu: Menu) => {
    if (!confirm(`'${menu.name}' 메뉴를 정말 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menu.id);

    if (error) {
      toast.error(`삭제 실패: ${error.message}`);
    } else {
      setMenus((prev) => prev.filter(m => m.id !== menu.id));
      toast.success(`'${menu.name}' 메뉴가 삭제되었습니다.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">메뉴 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            신규 메뉴 추가, 품절 처리 및 삭제를 할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          메뉴 추가
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">이미지</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>메뉴명</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">재고 수량</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell>
                  {menu.image_url ? (
                    menu.image_url.startsWith('http') || menu.image_url.startsWith('/') || menu.image_url.startsWith('data:') ? (
                      <img src={menu.image_url} alt={menu.name} className="w-10 h-10 object-cover rounded border" />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center text-xl bg-muted rounded border">
                        {menu.image_url}
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                      No Img
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-xs text-muted-foreground">{menu.category}</TableCell>
                <TableCell className="font-semibold">{menu.name}</TableCell>
                <TableCell className="text-right font-medium">{menu.price.toLocaleString()}원</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    menu.is_sold_out ? 'bg-destructive/15 text-destructive' : 'bg-green-100 text-green-800'
                  }`}>
                    {menu.is_sold_out ? '품절' : '판매중'}
                  </span>
                </TableCell>
                <TableCell className="text-center">{menu.stock_quantity}개</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleSoldOut(menu)}
                  >
                    {menu.is_sold_out ? '판매 재개' : '품절 처리'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteMenu(menu)}
                    title="메뉴 삭제"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {menus.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  등록된 메뉴가 없습니다. 오른쪽 상단의 '메뉴 추가' 버튼을 눌러 새 메뉴를 등록하세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Menu Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 메뉴 추가</DialogTitle>
            <DialogDescription>
              새로 판매할 음료나 디저트 메뉴 정보를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMenu} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="menu-name">메뉴명 <span className="text-destructive">*</span></Label>
              <Input
                id="menu-name"
                placeholder="예: 바닐라 크림 콜드브루"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="menu-category">카테고리</Label>
                <select
                  id="menu-category"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="COFFEE">COFFEE</option>
                  <option value="NON-COFFEE">NON-COFFEE</option>
                  <option value="DESSERT">DESSERT</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-price">가격 (원) <span className="text-destructive">*</span></Label>
                <Input
                  id="menu-price"
                  type="number"
                  placeholder="5500"
                  min="0"
                  step="100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-stock">초기 재고 수량</Label>
              <Input
                id="menu-stock"
                type="number"
                placeholder="100"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>

            {/* Drag and Drop Image Upload Area */}
            <div className="space-y-2">
              <Label>메뉴 이미지 (드래그 & 드롭 업로드)</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {imageUrl ? (
                /* Preview Container */
                <div className="relative border rounded-lg p-2 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:') ? (
                      <img src={imageUrl} alt="미리보기" className="w-14 h-14 object-cover rounded-md border bg-white" />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center text-3xl bg-muted rounded-md border">
                        {imageUrl}
                      </div>
                    )}
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-medium text-foreground block truncate">이미지 설정 완료</span>
                      <span className="truncate block opacity-70 max-w-[180px]">{imageUrl}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setImageUrl('')}
                    title="이미지 제거"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Drop Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    {uploading ? (
                      <>
                        <Loader2Icon className="h-7 w-7 text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground font-medium">이미지 업로드 처리 중...</p>
                      </>
                    ) : (
                      <>
                        <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                          <UploadCloudIcon className="h-6 w-6" />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-primary">클릭하여 파일 선택</span> 또는 이미지 파일 드래그 & 드롭
                        </div>
                        <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP, GIF 이미지 파일 지원</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Direct URL or Emoji Input toggle */}
              <div className="mt-2">
                <Input
                  placeholder="직접 이미지 URL 주소 또는 이모지(☕) 입력 가능"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={submitting || uploading}>
                {submitting ? '등록 중...' : '메뉴 추가 완료'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
